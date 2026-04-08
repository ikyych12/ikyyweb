import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useStore } from "../store";
import { ShieldCheck, Users, Wallet, Check, X, ArrowUpRight, ArrowDownRight, History, Send, Eye, Landmark, Settings, AlertTriangle } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { toast } from "sonner";
import { formatCurrency, cn } from "../lib/utils";
import { motion } from "motion/react";
import { Switch } from "../components/ui/Switch";
import { Textarea } from "../components/ui/Textarea";

export default function AdminPanel() {
  const { 
    currentUser, 
    users, 
    withdraws, 
    adminLogs, 
    adminActionWithdraw, 
    adminAdjustBalance,
    settings,
    updateSettings
  } = useStore();
  
  const [adjustAmounts, setAdjustAmounts] = React.useState<Record<string, string>>({});
  const [selectedWithdraw, setSelectedWithdraw] = React.useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
  const [maintMsg, setMaintMsg] = React.useState(settings?.maintenanceMessage || "");
  const [blastNumsText, setBlastNumsText] = React.useState(settings?.blastNumbers?.join("\n") || "");
  const [blastMsg, setBlastMsg] = React.useState(settings?.blastMessage || "");

  React.useEffect(() => {
    if (settings?.maintenanceMessage) {
      setMaintMsg(settings.maintenanceMessage);
    }
    if (settings?.blastNumbers) {
      setBlastNumsText(settings.blastNumbers.join("\n"));
    }
    if (settings?.blastMessage) {
      setBlastMsg(settings.blastMessage);
    }
  }, [settings?.maintenanceMessage, settings?.blastNumbers, settings?.blastMessage]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <ShieldCheck className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya untuk administrator.</p>
      </div>
    );
  }

  const handleAdjust = (userId: string) => {
    const amount = Number(adjustAmounts[userId]);
    if (isNaN(amount) || amount === 0) return toast.error("Masukkan jumlah yang valid.");
    
    adminAdjustBalance(userId, amount);
    const chatsAdded = amount > 0 ? Math.floor(amount / 5000) : 0;
    toast.success(`Saldo berhasil disesuaikan! ${amount > 0 ? `Otomatis +${chatsAdded} chat terkirim.` : ""}`);
    setAdjustAmounts(prev => ({ ...prev, [userId]: "" }));
  };

  const handleWithdrawAction = (requestId: string, action: 'approve' | 'reject') => {
    adminActionWithdraw(requestId, action);
    if (action === 'approve') {
      toast.success("Permintaan withdraw disetujui.");
    } else {
      toast.error("Permintaan withdraw ditolak. Saldo dikembalikan ke user.");
    }
    setIsDetailModalOpen(false);
  };

  const openDetails = (wd: any) => {
    const user = users.find(u => u.id === wd.userId);
    setSelectedWithdraw({ ...wd, user });
    setIsDetailModalOpen(true);
  };

  const stats = {
    totalUsers: users.length - 1, // Exclude admin
    totalWithdrawPending: withdraws.filter(w => w.status === 'pending').length,
    totalBalanceAll: users.reduce((acc, u) => acc + u.balance, 0),
    totalChatsAll: users.reduce((acc, u) => acc + u.totalChats, 0),
  };

  const handleSaveSettings = () => {
    const nums = blastNumsText.split("\n").map(n => n.trim()).filter(n => n.length > 0);
    updateSettings({ 
      maintenanceMessage: maintMsg,
      blastNumbers: nums,
      blastMessage: blastMsg
    });
    toast.success("Pengaturan sistem berhasil diperbarui.");
  };

  const toggleMaintenance = (val: boolean) => {
    updateSettings({ maintenanceMode: val });
    toast.success(`Mode maintenance ${val ? "DIAKTIFKAN" : "DIMATIKAN"}.`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Kelola seluruh pengguna dan sistem BlastWA.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Kode Referral Admin</p>
              <p className="text-xl font-black tracking-widest text-primary">{currentUser?.referralCode}</p>
              <p className="text-[9px] text-muted-foreground">Bonus pendaftar: Rp 2.000</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total User</p>
              <p className="text-xl font-bold">{stats.totalUsers}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Withdraw Pending</p>
              <p className="text-xl font-bold">{stats.totalWithdrawPending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Saldo User</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalBalanceAll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase">Total Chat System</p>
              <p className="text-xl font-bold">{stats.totalChatsAll}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Pengaturan Sistem</CardTitle>
            </div>
            <CardDescription>Kelola mode pemeliharaan dan pesan sistem.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-4 h-4", settings?.maintenanceMode ? "text-amber-500" : "text-muted-foreground")} />
                  <p className="font-medium">Mode Maintenance</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, user (selain admin) tidak akan bisa menambahkan perangkat baru.
                </p>
              </div>
              <Switch 
                checked={!!settings?.maintenanceMode} 
                onCheckedChange={toggleMaintenance} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Pesan Maintenance</label>
              <Textarea 
                placeholder="Masukkan pesan yang akan tampil saat user mencoba menautkan perangkat..."
                value={maintMsg}
                onChange={(e) => setMaintMsg(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleSaveSettings} size="sm">
                Simpan Pesan
              </Button>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">Pesan Blast Default (Admin Only)</label>
              <p className="text-xs text-muted-foreground">
                Pesan ini akan digunakan oleh semua user saat melakukan blast massal.
              </p>
              <Textarea 
                placeholder="Halo, ini adalah pesan blast otomatis..."
                value={blastMsg}
                onChange={(e) => setBlastMsg(e.target.value)}
                className="min-h-[100px]"
              />
              <Button onClick={handleSaveSettings} size="sm">
                Simpan Pesan Blast
              </Button>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <label className="text-sm font-medium">Nomor Target Blast (Admin Only)</label>
              <p className="text-xs text-muted-foreground">
                Daftar nomor ini akan digunakan oleh semua user saat melakukan blast. Satu nomor per baris.
              </p>
              <Textarea 
                placeholder="628123456789&#10;628987654321"
                value={blastNumsText}
                onChange={(e) => setBlastNumsText(e.target.value)}
                className="min-h-[150px] font-mono text-xs"
              />
              <Button onClick={handleSaveSettings} size="sm">
                Simpan Nomor Blast
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna & Atur Saldo</CardTitle>
            <CardDescription>Kelola saldo dan lihat statistik setiap pengguna.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="h-12 px-4 text-left font-medium">User</th>
                    <th className="h-12 px-4 text-left font-medium">Saldo</th>
                    <th className="h-12 px-4 text-left font-medium">Total Chat</th>
                    <th className="h-12 px-4 text-left font-medium">Atur Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role !== 'admin').map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.username}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold">{formatCurrency(user.balance)}</td>
                      <td className="p-4">{user.totalChats} Chat</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">Rp</span>
                            <Input 
                              type="number" 
                              placeholder="Jumlah" 
                              className="w-32 h-9 pl-7 text-xs"
                              value={adjustAmounts[user.id] || ""}
                              onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [user.id]: e.target.value }))}
                            />
                          </div>
                          <Button 
                            size="sm" 
                            className="h-9 px-3 text-xs bg-emerald-600 hover:bg-emerald-700" 
                            onClick={() => handleAdjust(user.id)}
                          >
                            Add/Sub
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          Gunakan minus (-) untuk mengurangi
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permintaan Withdraw</CardTitle>
            <CardDescription>Setujui atau tolak permintaan penarikan dana.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="h-12 px-4 text-left font-medium">User</th>
                    <th className="h-12 px-4 text-left font-medium">Jumlah</th>
                    <th className="h-12 px-4 text-left font-medium">Metode & Detail</th>
                    <th className="h-12 px-4 text-left font-medium">Status</th>
                    <th className="h-12 px-4 text-left font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {withdraws.filter(w => w.status === 'pending').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground italic">
                        Tidak ada permintaan withdraw pending.
                      </td>
                    </tr>
                  ) : (
                    withdraws.filter(w => w.status === 'pending').map((wd) => (
                      <tr key={wd.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 font-medium">{wd.username}</td>
                        <td className="p-4 font-bold">{formatCurrency(wd.amount)}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{wd.method}</span>
                            <span className="text-[10px] text-muted-foreground max-w-[200px] truncate">{wd.details}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">PENDING</Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-2 text-xs gap-1"
                              onClick={() => openDetails(wd)}
                            >
                              <Eye className="w-3 h-3" />
                              Detail
                            </Button>
                            <Button 
                              size="sm" 
                              className="bg-emerald-600 hover:bg-emerald-700 h-8 px-3 text-xs gap-1"
                              onClick={() => handleWithdrawAction(wd.id, 'approve')}
                            >
                              <Check className="w-3 h-3" />
                              Setujui
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-8 px-3 text-xs gap-1"
                              onClick={() => handleWithdrawAction(wd.id, 'reject')}
                            >
                              <X className="w-3 h-3" />
                              Tolak
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Penyesuaian Saldo</CardTitle>
            <CardDescription>Riwayat aksi admin dalam menambah/mengurangi saldo user.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="h-12 px-4 text-left font-medium">Waktu</th>
                    <th className="h-12 px-4 text-left font-medium">Target User</th>
                    <th className="h-12 px-4 text-left font-medium">Aksi</th>
                    <th className="h-12 px-4 text-left font-medium">Jumlah</th>
                    <th className="h-12 px-4 text-left font-medium">Auto Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-24 text-center text-muted-foreground italic">
                        Belum ada log transaksi.
                      </td>
                    </tr>
                  ) : (
                    adminLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="p-4 font-medium">{log.targetUsername}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            {log.action === 'credit' ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-destructive" />
                            )}
                            <span className={log.action === 'credit' ? "text-emerald-500" : "text-destructive"}>
                              {log.action.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-bold">{formatCurrency(log.amount)}</td>
                        <td className="p-4 text-muted-foreground">
                          {log.chatsAdded > 0 ? `+${log.chatsAdded} Chat` : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        title="Detail Permintaan Withdraw"
      >
        {selectedWithdraw && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">User</p>
                <p className="font-medium">{selectedWithdraw.username}</p>
                <p className="text-xs text-muted-foreground">{selectedWithdraw.user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-bold">Waktu Request</p>
                <p className="font-medium">{new Date(selectedWithdraw.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Jumlah Penarikan</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(selectedWithdraw.amount)}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  Informasi Pembayaran (Saat Request)
                </p>
                <div className="p-3 bg-muted rounded-md text-sm font-mono">
                  {selectedWithdraw.details}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-bold flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Profil Pembayaran Saat Ini
                </p>
                <div className="grid gap-2">
                  <div className="p-3 border rounded-md text-xs">
                    <p className="font-bold mb-1">Bank Info:</p>
                    {selectedWithdraw.user?.bankInfo ? (
                      <p>{selectedWithdraw.user.bankInfo.bankName} - {selectedWithdraw.user.bankInfo.accountNumber} ({selectedWithdraw.user.bankInfo.accountHolder})</p>
                    ) : (
                      <p className="italic text-muted-foreground">Belum diatur</p>
                    )}
                  </div>
                  <div className="p-3 border rounded-md text-xs">
                    <p className="font-bold mb-1">E-Wallet Info:</p>
                    {selectedWithdraw.user?.walletInfo ? (
                      <p>{selectedWithdraw.user.walletInfo.provider} - {selectedWithdraw.user.walletInfo.number}</p>
                    ) : (
                      <p className="italic text-muted-foreground">Belum diatur</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={() => handleWithdrawAction(selectedWithdraw.id, 'approve')}
              >
                <Check className="w-4 h-4" />
                Setujui
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 gap-2"
                onClick={() => handleWithdrawAction(selectedWithdraw.id, 'reject')}
              >
                <X className="w-4 h-4" />
                Tolak
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
