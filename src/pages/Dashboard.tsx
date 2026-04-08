import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { useStore } from "../store";
import { formatCurrency, cn } from "../lib/utils";
import { Send, Users, Wallet, History, PlusCircle, AlertCircle, UserCircle, Key } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { currentUser } = useStore();
  const [isTopUpOpen, setIsTopUpOpen] = React.useState(false);

  const stats = [
    { 
      name: "Saldo Komisi", 
      value: formatCurrency(currentUser?.balance || 0), 
      icon: Wallet, 
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      action: () => setIsTopUpOpen(true)
    },
    { 
      name: "Total Chat Terkirim", 
      value: `${currentUser?.totalChats || 0} Chat`, 
      icon: Send, 
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    { 
      name: "API Key Status", 
      value: currentUser?.apiKey ? "Aktif" : "Belum Dibuat", 
      icon: Key, 
      color: "text-amber-500",
      bg: "bg-amber-500/10"
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di BlastWA, {currentUser?.username}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    {stat.action && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0 text-xs mt-2 gap-1"
                        onClick={stat.action}
                      >
                        <PlusCircle className="w-3 h-3" />
                        Top Up Saldo
                      </Button>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informasi Sistem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Biaya Sewa / Chat</span>
              <span className="font-medium">{formatCurrency(5000)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Bonus Referral</span>
              <span className="font-medium">{formatCurrency(500)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Minimal Withdraw</span>
              <span className="font-medium">{formatCurrency(10000)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Akun</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
            <div className="text-center">
              <h4 className="font-bold">{currentUser?.username}</h4>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              <Badge variant="secondary" className="mt-2 uppercase">
                {currentUser?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} title="Top Up Saldo Komisi">
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-700">
              Untuk menambah saldo, silakan lakukan transfer ke rekening di bawah ini dan hubungi Admin untuk konfirmasi.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 border rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold">Bank BCA</p>
              <p className="text-lg font-mono font-bold">1234567890</p>
              <p className="text-sm">A/N PT BLAST WA INDONESIA</p>
            </div>
            <div className="p-4 border rounded-lg space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold">E-Wallet DANA</p>
              <p className="text-lg font-mono font-bold">0812-3456-7890</p>
              <p className="text-sm">A/N BLASTWA OFFICIAL</p>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full" onClick={() => {
              toast.info("Membuka WhatsApp Admin...");
              setIsTopUpOpen(false);
            }}>
              Konfirmasi via WhatsApp Admin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
