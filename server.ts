import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = pino({ level: "silent" });
const sessions = new Map<string, any>();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // WhatsApp Session Management
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("init-session", async (deviceId: string, phoneNumber?: string, method: 'qr' | 'pairing' = 'qr') => {
      console.log(`Initializing ${method} session for: ${deviceId} (Socket: ${socket.id})`);
      
      // Join a room for this device to handle refreshes/multiple tabs
      socket.join(`device-${deviceId}`);
      
      await createWhatsAppSession(deviceId, phoneNumber, method);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  async function createWhatsAppSession(deviceId: string, phoneNumber?: string, method: 'qr' | 'pairing' = 'qr') {
    try {
      // If session already exists and is connected, just notify the client
      const existingSock = sessions.get(deviceId);
      if (existingSock) {
        console.log(`[${deviceId}] Session already exists. Checking state...`);
        // We could check connection state here, but for now let's just restart to be sure
        // or just return if it's already open.
        // To be safe and allow re-pairing, let's close the old one.
        try {
          existingSock.ev.removeAllListeners("connection.update");
          existingSock.logout();
          existingSock.end(undefined);
        } catch (e) {}
        sessions.delete(deviceId);
      }

      const sessionDir = path.join(__dirname, "sessions", deviceId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      console.log(`[${deviceId}] Starting session initialization (${method})...`);
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      let version;
      try {
        const latest = await fetchLatestBaileysVersion();
        version = latest.version;
      } catch (err) {
        version = [2, 3000, 1015901307];
      }

      const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: ["Linux", "Chrome", "110.0.5481.178"], // Standard browser string
      });

      sessions.set(deviceId, sock);

      if (method === 'pairing' && phoneNumber && !sock.authState.creds.registered) {
        // Wait for the socket to be ready
        setTimeout(async () => {
          try {
            let formattedPhone = phoneNumber.replace(/\D/g, '');
            // Simple Indonesian number fix: 08 -> 628
            if (formattedPhone.startsWith('0')) {
              formattedPhone = '62' + formattedPhone.slice(1);
            }
            
            console.log(`[${deviceId}] Requesting pairing code for ${formattedPhone}...`);
            const code = await sock.requestPairingCode(formattedPhone);
            console.log(`[${deviceId}] Pairing code generated:`, code);
            io.to(`device-${deviceId}`).emit("pairing-code", { deviceId, code });
          } catch (err) {
            console.error(`[${deviceId}] Failed to request pairing code:`, err);
            const errMsg = err instanceof Error ? err.message : "Gagal meminta Pairing Code";
            io.to(`device-${deviceId}`).emit("error", { 
              deviceId, 
              message: `Gagal: ${errMsg}. Pastikan nomor benar (gunakan format 628xxx) dan belum tertaut.` 
            });
          }
        }, 5000);
      }

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log(`[${deviceId}] Connection update:`, connection);

        if (qr && method === 'qr') {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            io.to(`device-${deviceId}`).emit("qr", { deviceId, qr: qrDataUrl });
          } catch (qrErr) {
            io.to(`device-${deviceId}`).emit("error", { deviceId, message: "Gagal membuat QR Code" });
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log(`[${deviceId}] Connection closed. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
          
          io.to(`device-${deviceId}`).emit("status", { deviceId, status: "disconnected" });
          
          if (shouldReconnect) {
            createWhatsAppSession(deviceId, phoneNumber, method);
          } else {
            sessions.delete(deviceId);
            if (fs.existsSync(sessionDir)) {
              try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
              } catch (rmErr) {}
            }
          }
        } else if (connection === "open") {
          console.log(`[${deviceId}] Connection opened successfully`);
          const phoneNumber = sock.user?.id.split(":")[0];
          io.to(`device-${deviceId}`).emit("status", { deviceId, status: "connected", phoneNumber });
        }
      });

      return sock;
    } catch (err) {
      console.error(`[${deviceId}] Critical session error:`, err);
      io.to(`device-${deviceId}`).emit("error", { deviceId, message: "Gagal inisialisasi sesi WhatsApp" });
    }
  }

  // API to sync data from client (since we use localStorage as primary store)
  app.post("/api/sync-data", (req, res) => {
    try {
      const data = req.body;
      const dataDir = path.join(__dirname, "data");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(path.join(dataDir, "store.json"), JSON.stringify(data, null, 2));
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to sync data:", err);
      res.status(500).json({ error: "Failed to sync data" });
    }
  });

  // Bot API Middleware
  const validateApiKey = (req: any, res: any, next: any) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "API Key is required" });

    try {
      const dataPath = path.join(__dirname, "data", "store.json");
      if (!fs.existsSync(dataPath)) return res.status(500).json({ error: "Server data not initialized" });
      
      const store = JSON.parse(fs.readFileSync(dataPath, "utf8"));
      const user = store.users.find((u: any) => u.apiKey === apiKey);
      
      if (!user) return res.status(401).json({ error: "Invalid API Key" });
      
      req.user = user;
      req.userDevices = store.devices.filter((d: any) => d.userId === user.id);
      next();
    } catch (err) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  // Bot API Endpoints
  app.get("/api/v1/devices", validateApiKey, (req: any, res: any) => {
    res.json({ devices: req.userDevices });
  });

  app.get("/api/v1/devices/:deviceId/status", validateApiKey, (req: any, res: any) => {
    const { deviceId } = req.params;
    const device = req.userDevices.find((d: any) => d.id === deviceId);
    if (!device) return res.status(404).json({ error: "Device not found" });
    
    const sock = sessions.get(deviceId);
    res.json({ 
      id: deviceId,
      status: device.status,
      sessionActive: !!sock,
      phoneNumber: device.phoneNumber
    });
  });

  app.post("/api/v1/messages/send", validateApiKey, async (req: any, res: any) => {
    const { deviceId, to, message } = req.body;
    if (!deviceId || !to || !message) return res.status(400).json({ error: "Missing required fields" });

    const device = req.userDevices.find((d: any) => d.id === deviceId);
    if (!device) return res.status(404).json({ error: "Device not found or not owned by you" });

    const sock = sessions.get(deviceId);
    if (!sock) return res.status(400).json({ error: "WhatsApp session not active for this device" });

    try {
      const jid = to.includes("@s.whatsapp.net") ? to : `${to.replace(/\D/g, "")}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Bot API error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // API to send message (Internal/Frontend)
  app.post("/api/send-message", async (req, res) => {
    const { deviceId, to, message } = req.body;
    const sock = sessions.get(deviceId);

    if (!sock) {
      return res.status(404).json({ error: "Session not found" });
    }

    try {
      const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text: message });
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // API to delete session
  app.delete("/api/sessions/:deviceId", async (req, res) => {
    const { deviceId } = req.params;
    const sock = sessions.get(deviceId);

    if (sock) {
      try {
        sock.ev.removeAllListeners("connection.update");
        sock.logout();
        sock.end(undefined);
      } catch (e) {}
      sessions.delete(deviceId);
    }

    const sessionDir = path.join(__dirname, "sessions", deviceId);
    if (fs.existsSync(sessionDir)) {
      try {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error("Failed to remove session dir:", rmErr);
      }
    }

    res.json({ success: true });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
