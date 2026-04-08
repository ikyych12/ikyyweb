import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useStore } from "../store";
import { Smartphone, Plus, Trash2, QrCode, Hash, RefreshCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { io, Socket } from "socket.io-client";
import { cn } from "../lib/utils";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function Devices() {
  const { currentUser, devices, addDevice, updateDeviceStatus, deleteDevice, settings } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [method, setMethod] = React.useState<'qr' | 'pairing'>('qr');
  
  const [pairingDevice, setPairingDevice] = React.useState<string | null>(null);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [socket, setSocket] = React.useState<Socket | null>(null);

  React.useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          // Logic when QR is scanned
          // Assuming QR contains "name|phone" or just "phone"
          if (decodedText.includes("|")) {
            const [name, phone] = decodedText.split("|");
            setDeviceName(name);
            setPhoneNumber(phone);
          } else {
            setPhoneNumber(decodedText);
          }
          toast.success("Data berhasil dipindai!");
          setIsScannerOpen(false);
          scanner.clear();
        },
        (error) => {
          // console.warn(error);
        }
      );

      return () => {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      };
    }
  }, [isScannerOpen]);

  const userDevices = devices.filter(d => d.userId === currentUser?.id);

  React.useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("qr", ({ deviceId, qr }) => {
      setQrCode(qr);
    });

    newSocket.on("status", ({ deviceId, status, phoneNumber }) => {
      updateDeviceStatus(deviceId, status, phoneNumber);
      if (status === "connected") {
        toast.success("Perangkat berhasil terhubung!");
        setPairingDevice(null);
        setQrCode(null);
      }
    });

    newSocket.on("error", ({ deviceId, message }) => {
      toast.error(message);
      setPairingDevice(null);
      setQrCode(null);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (settings?.maintenanceMode && currentUser?.role !== 'admin') {
      toast.error(settings.maintenanceMessage || "Sistem sedang dalam pemeliharaan.");
      setIsAddModalOpen(false);
      return;
    }

    addDevice(deviceName, phoneNumber, method);
    toast.success("Perangkat berhasil ditambahkan!");
    setIsAddModalOpen(false);
    setDeviceName("");
    setPhoneNumber("");
  };

  const startPairing = (deviceId: string) => {
    if (!socket) return;
    setPairingDevice(deviceId);
    setQrCode(null);
    socket.emit("init-session", deviceId);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perangkat</h1>
          <p className="text-muted-foreground">Kelola perangkat WhatsApp Anda di sini.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Perangkat
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userDevices.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Smartphone className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold">Belum ada perangkat</h3>
                <p className="text-sm text-muted-foreground">Tambahkan perangkat WhatsApp pertama Anda untuk mulai blasting.</p>
              </div>
              <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>Tambah Sekarang</Button>
            </CardContent>
          </Card>
        ) : (
          userDevices.map((device, i) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={cn("transition-all", device.status === 'connected' ? "border-primary/50" : "")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        device.status === 'connected' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      )} />
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                    </div>
                    <Badge variant={device.status === 'connected' ? 'success' : 'secondary'}>
                      {device.status === 'connected' ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <CardDescription>{device.phoneNumber}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pairingDevice === device.id && (
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg space-y-3">
                      {!isScannerOpen ? (
                        qrCode ? (
                          <>
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <img src={qrCode} alt="WhatsApp QR Code" className="w-32 h-32" />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground animate-pulse">Scan QR ini di WhatsApp Anda</p>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[10px] h-6"
                              onClick={() => setIsScannerOpen(true)}
                            >
                              Gunakan Kamera untuk Scan Kode
                            </Button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-xs text-muted-foreground">Menyiapkan QR Code...</p>
                          </div>
                        )
                      ) : (
                        <div className="w-full space-y-2">
                          <div id="reader" className="w-full overflow-hidden rounded-lg border bg-black aspect-square"></div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-[10px]"
                            onClick={() => setIsScannerOpen(false)}
                          >
                            Tutup Kamera
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={device.status === 'connected' ? "outline" : "default"} 
                      className="flex-1 gap-2"
                      onClick={() => startPairing(device.id)}
                      disabled={device.status === 'connected' || pairingDevice === device.id}
                    >
                      {pairingDevice === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4" />
                      )}
                      {device.status === 'connected' ? 'Connected' : pairingDevice === device.id ? 'Pairing...' : 'Connect'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => {
                        deleteDevice(device.id);
                        toast.info("Perangkat dihapus.");
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        title="Tambah Perangkat Baru"
      >
        <form onSubmit={handleAddDevice} className="space-y-4">
          {!isScannerOpen ? (
            <Button 
              type="button" 
              variant="outline" 
              className="w-full gap-2 border-dashed"
              onClick={() => setIsScannerOpen(true)}
            >
              <QrCode className="w-4 h-4" />
              Scan QR untuk Isi Otomatis
            </Button>
          ) : (
            <div className="space-y-2">
              <div id="reader" className="overflow-hidden rounded-lg border bg-black"></div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => setIsScannerOpen(false)}
              >
                Batal Scan
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Perangkat</label>
            <Input 
              placeholder="Misal: WA Bisnis" 
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nomor WhatsApp</label>
            <Input 
              placeholder="628123456789" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Metode Koneksi</label>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                type="button"
                variant={method === 'qr' ? 'default' : 'outline'}
                onClick={() => setMethod('qr')}
                className="gap-2"
              >
                <QrCode className="w-4 h-4" />
                Scan QR
              </Button>
              <Button 
                type="button"
                variant={method === 'pairing' ? 'default' : 'outline'}
                onClick={() => setMethod('pairing')}
                className="gap-2"
              >
                <Hash className="w-4 h-4" />
                Pairing Code
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full mt-4">Simpan Perangkat</Button>
        </form>
      </Modal>
    </div>
  );
}
