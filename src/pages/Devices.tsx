import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { useStore } from "../store";
import { Smartphone, Plus, Trash2, QrCode, Hash, RefreshCcw, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { io, Socket } from "socket.io-client";
import { cn } from "../lib/utils";

export default function Devices() {
  const { currentUser, devices, addDevice, updateDeviceStatus, deleteDevice, settings } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState("");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [method, setMethod] = React.useState<'qr' | 'pairing'>('qr');
  
  const [pairingDevice, setPairingDevice] = React.useState<string | null>(null);
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [pairingCode, setPairingCode] = React.useState<string | null>(null);
  const [socket, setSocket] = React.useState<Socket | null>(null);

  const userDevices = devices.filter(d => d.userId === currentUser?.id);

  React.useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("qr", ({ deviceId, qr }) => {
      setQrCode(qr);
      setPairingCode(null);
    });

    newSocket.on("pairing-code", ({ deviceId, code }) => {
      setPairingCode(code);
      setQrCode(null);
    });

    newSocket.on("status", ({ deviceId, status, phoneNumber }) => {
      updateDeviceStatus(deviceId, status, phoneNumber);
      if (status === "connected") {
        toast.success("Perangkat berhasil terhubung!");
        setPairingDevice(null);
        setQrCode(null);
        setPairingCode(null);
      }
    });

    newSocket.on("error", ({ deviceId, message }) => {
      toast.error(message);
      setPairingDevice(null);
      setQrCode(null);
      setPairingCode(null);
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

  const startPairing = (deviceId: string, phone: string, method: 'qr' | 'pairing') => {
    if (!socket) return;
    setPairingDevice(deviceId);
    setQrCode(null);
    setPairingCode(null);
    socket.emit("init-session", deviceId, phone, method);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Perangkat</h1>
          <p className="text-muted-foreground">Kelola perangkat WhatsApp Anda di sini.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => window.dispatchEvent(new Event('storage_update'))}
            title="Refresh Data"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Tambah Perangkat
          </Button>
        </div>
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
                      {device.connectionMethod === 'qr' ? (
                        qrCode ? (
                          <>
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <img src={qrCode} alt="WhatsApp QR Code" className="w-32 h-32" />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground animate-pulse">Scan QR ini di WhatsApp Anda</p>
                          </>
                        ) : (
                          <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-xs text-muted-foreground">Menyiapkan QR Code...</p>
                          </div>
                        )
                      ) : (
                        pairingCode ? (
                          <div className="text-center space-y-2">
                            <div className="flex gap-1 justify-center">
                              {pairingCode.split('').map((char, idx) => (
                                <div key={idx} className="w-8 h-10 bg-background border rounded flex items-center justify-center text-xl font-bold shadow-sm">
                                  {char}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Masukkan kode ini di WhatsApp Anda</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <p className="text-xs text-muted-foreground">Menyiapkan Pairing Code...</p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant={device.status === 'connected' ? "outline" : "default"} 
                      className="flex-1 gap-2"
                      onClick={() => startPairing(device.id, device.phoneNumber, device.connectionMethod)}
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
                      variant="outline" 
                      size="icon"
                      onClick={async () => {
                        toast.promise(
                          fetch(`/api/sessions/${device.id}`, { method: 'DELETE' }),
                          {
                            loading: 'Mereset sesi...',
                            success: 'Sesi berhasil direset. Silakan hubungkan ulang.',
                            error: 'Gagal mereset sesi.'
                          }
                        );
                        setPairingDevice(null);
                        setQrCode(null);
                        setPairingCode(null);
                        updateDeviceStatus(device.id, 'disconnected');
                      }}
                      title="Reset Sesi (Gunakan jika stuck)"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={async () => {
                        if (confirm("Hapus perangkat ini? Sesi WhatsApp juga akan dihapus.")) {
                          try {
                            await fetch(`/api/sessions/${device.id}`, { method: 'DELETE' });
                            deleteDevice(device.id);
                            toast.info("Perangkat dan sesi dihapus.");
                          } catch (err) {
                            toast.error("Gagal menghapus sesi di server.");
                            deleteDevice(device.id);
                          }
                        }
                      }}
                      title="Hapus Perangkat"
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
