import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useStore } from "../store";
import { Send, Smartphone, Play, Pause, RotateCcw, AlertCircle, Settings2, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Switch } from "../components/ui/Switch";

interface DeviceBlastStatus {
  isBlasting: boolean;
  progress: { total: number; sent: number };
  logs: string[];
  intervalId?: any;
}

export default function Blast() {
  const { currentUser, devices, processBlast, settings } = useStore();
  const [message, setMessage] = React.useState(settings?.blastMessage || "");
  const [delay, setDelay] = React.useState(1); // Default 1s as requested
  const [mode, setMode] = React.useState<'safe' | 'fast'>('safe');

  React.useEffect(() => {
    if (settings?.blastMessage) {
      setMessage(settings.blastMessage);
    }
  }, [settings?.blastMessage]);
  
  const [deviceStatuses, setDeviceStatuses] = React.useState<Record<string, DeviceBlastStatus>>({});

  const connectedDevices = devices.filter(d => d.userId === currentUser?.id && d.status === 'connected');

  const toggleBlast = (deviceId: string) => {
    const currentStatus = deviceStatuses[deviceId];
    
    if (currentStatus?.isBlasting) {
      // Stop blasting
      clearInterval(currentStatus.intervalId);
      setDeviceStatuses(prev => ({
        ...prev,
        [deviceId]: { ...prev[deviceId], isBlasting: false, intervalId: undefined }
      }));
      toast.info(`Blast dihentikan pada ${devices.find(d => d.id === deviceId)?.name}`);
    } else {
      // Start blasting
      if (!message.trim()) return toast.error("Tulis pesan blast.");
      const numbers = settings.blastNumbers || [];
      if (numbers.length === 0) return toast.error("Tidak ada nomor target dari Admin.");

      const status: DeviceBlastStatus = {
        isBlasting: true,
        progress: { total: numbers.length, sent: 0 },
        logs: ["Memulai proses blast..."],
      };

      let currentSent = 0;
      const interval = setInterval(() => {
        setDeviceStatuses(prev => {
          const deviceStatus = prev[deviceId];
          if (!deviceStatus || currentSent >= numbers.length) {
            clearInterval(deviceStatus?.intervalId);
            if (currentSent >= numbers.length) {
              processBlast(currentUser!.id, numbers.length);
              toast.success(`Blast selesai pada ${devices.find(d => d.id === deviceId)?.name}`);
            }
            return {
              ...prev,
              [deviceId]: { ...deviceStatus, isBlasting: false, intervalId: undefined }
            };
          }

          currentSent++;
          return {
            ...prev,
            [deviceId]: {
              ...deviceStatus,
              progress: { total: numbers.length, sent: currentSent },
              logs: [`[${new Date().toLocaleTimeString()}] Terkirim ke ${numbers[currentSent-1]}`, ...deviceStatus.logs].slice(0, 50)
            }
          };
        });
      }, delay * 1000);

      setDeviceStatuses(prev => ({
        ...prev,
        [deviceId]: { ...status, intervalId: interval }
      }));
    }
  };

  const blastAll = () => {
    const allBlasting = connectedDevices.every(d => deviceStatuses[d.id]?.isBlasting);
    
    if (allBlasting) {
      // Stop all
      connectedDevices.forEach(d => {
        if (deviceStatuses[d.id]?.isBlasting) toggleBlast(d.id);
      });
      toast.info("Semua proses blast dihentikan.");
    } else {
      // Start all that are not blasting
      if (!message.trim()) return toast.error("Tulis pesan blast.");
      if ((settings.blastNumbers || []).length === 0) return toast.error("Tidak ada nomor target dari Admin.");
      
      connectedDevices.forEach(d => {
        if (!deviceStatuses[d.id]?.isBlasting) toggleBlast(d.id);
      });
      toast.success("Memulai blast pada semua perangkat.");
    }
  };

  const isAnyBlasting = Object.values(deviceStatuses).some((s: DeviceBlastStatus) => s.isBlasting);
  const isAllBlasting = connectedDevices.length > 0 && connectedDevices.every(d => deviceStatuses[d.id]?.isBlasting);

  React.useEffect(() => {
    return () => {
      // Cleanup intervals on unmount
      Object.values(deviceStatuses).forEach((s: DeviceBlastStatus) => {
        if (s.intervalId) clearInterval(s.intervalId);
      });
    };
  }, [deviceStatuses]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blast WhatsApp</h1>
          <p className="text-muted-foreground">Gunakan nomor target otomatis dari Admin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 px-3 border-r">
              <Clock className="w-4 h-4 text-primary" />
              <select 
                className="bg-transparent text-sm font-medium focus:outline-none"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              >
                <option value={1}>1s Delay</option>
                <option value={2}>2s Delay</option>
                <option value={3}>3s Delay</option>
                <option value={5}>5s Delay</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <select 
                className="bg-transparent text-sm font-medium focus:outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
              >
                <option value="safe">Safe Mode</option>
                <option value="fast">Turbo Mode</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={blastAll} 
            variant={isAllBlasting ? "destructive" : "default"}
            className="gap-2 shadow-lg"
            disabled={connectedDevices.length === 0}
          >
            {isAllBlasting ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAllBlasting ? "Stop All" : "Blast All Devices"}
          </Button>
        </div>
      </div>

      {currentUser?.role === 'admin' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Pesan Blast
            </CardTitle>
            <CardDescription>
              Pesan ini diatur oleh Admin (Anda dapat mengubahnya di sini atau di Admin Panel).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea 
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Tulis pesan Anda di sini..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Perangkat Terhubung
            </h2>
            <Badge variant="outline" className="text-[10px]">
              {connectedDevices.length} ACTIVE
            </Badge>
          </div>
          
          {connectedDevices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada perangkat yang aktif.</p>
                <Button variant="link" className="text-xs" onClick={() => window.location.href='/devices'}>
                  Tautkan Perangkat Sekarang
                </Button>
              </CardContent>
            </Card>
          ) : (
            connectedDevices.map((device) => {
              const status = deviceStatuses[device.id] || { isBlasting: false, progress: { total: 0, sent: 0 }, logs: [] };
              return (
                <Card key={device.id} className={cn("transition-all overflow-hidden", status.isBlasting && "border-primary ring-1 ring-primary/20")}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-full", status.isBlasting ? "bg-primary/10 text-primary animate-pulse" : "bg-muted text-muted-foreground")}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{device.name}</p>
                          <p className="text-[10px] text-muted-foreground">{device.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={status.isBlasting ? "destructive" : "default"}
                          className="h-8 px-3 text-xs gap-1.5"
                          onClick={() => toggleBlast(device.id)}
                        >
                          {status.isBlasting ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {status.isBlasting ? "Stop" : "Blast"}
                        </Button>
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                          <Switch 
                            checked={status.isBlasting}
                            onCheckedChange={() => toggleBlast(device.id)}
                          />
                        </div>
                      </div>
                    </div>

                    {status.isBlasting && (
                      <div className="px-4 pb-4 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-primary">SENDING...</span>
                          <span>{status.progress.sent} / {status.progress.total}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${(status.progress.sent / status.progress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Live Logs
          </h2>
          <Card className="h-[400px] overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-y-auto bg-black/5 font-mono text-[10px] p-4 space-y-1">
              {Object.values(deviceStatuses).some((s: DeviceBlastStatus) => s.logs.length > 0) ? (
                Object.entries(deviceStatuses).map(([deviceId, status]: [string, DeviceBlastStatus]) => (
                  <div key={deviceId}>
                    {status.logs.map((log, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-primary shrink-0">[{devices.find(d => d.id === deviceId)?.name}]</span>
                        <span className="text-muted-foreground">{log}</span>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground italic text-center mt-20">Menunggu aktivitas blast...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
