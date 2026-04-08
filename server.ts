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

    socket.on("init-session", async (deviceId: string) => {
      console.log("Initializing session for:", deviceId);
      await createWhatsAppSession(deviceId, socket);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  async function createWhatsAppSession(deviceId: string, socket: any) {
    try {
      const sessionDir = path.join(__dirname, "sessions", deviceId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      console.log(`[${deviceId}] Starting session initialization...`);
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
      
      let version;
      try {
        const latest = await fetchLatestBaileysVersion();
        version = latest.version;
        console.log(`[${deviceId}] Using Baileys version:`, version.join("."));
      } catch (err) {
        console.error(`[${deviceId}] Failed to fetch version, using default`, err);
        version = [2, 3000, 1015901307]; // Fallback version
      }

      const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        browser: ["BlastWA", "Chrome", "1.0.0"],
      });

      sessions.set(deviceId, sock);

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        console.log(`[${deviceId}] Connection update:`, connection);

        if (qr) {
          try {
            console.log(`[${deviceId}] QR generated`);
            const qrDataUrl = await QRCode.toDataURL(qr);
            socket.emit("qr", { deviceId, qr: qrDataUrl });
          } catch (qrErr) {
            console.error(`[${deviceId}] QR generation error:`, qrErr);
            socket.emit("error", { deviceId, message: "Gagal membuat QR Code" });
          }
        }

        if (connection === "close") {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log(`[${deviceId}] Connection closed. Status: ${statusCode}, Reconnecting: ${shouldReconnect}`);
          
          socket.emit("status", { deviceId, status: "disconnected" });
          
          if (shouldReconnect) {
            createWhatsAppSession(deviceId, socket);
          } else {
            sessions.delete(deviceId);
            if (fs.existsSync(sessionDir)) {
              try {
                fs.rmSync(sessionDir, { recursive: true, force: true });
              } catch (rmErr) {
                console.error("Failed to remove session dir:", rmErr);
              }
            }
          }
        } else if (connection === "open") {
          console.log(`[${deviceId}] Connection opened successfully`);
          const phoneNumber = sock.user?.id.split(":")[0];
          socket.emit("status", { deviceId, status: "connected", phoneNumber });
        }
      });

      return sock;
    } catch (err) {
      console.error(`[${deviceId}] Critical session error:`, err);
      socket.emit("error", { deviceId, message: "Gagal inisialisasi sesi WhatsApp" });
    }
  }

  // API to send message
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
