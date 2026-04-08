import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { useStore } from "../store";
import { Wallet, History, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../lib/utils";

export default function WithdrawHistory() {
  const { currentUser, withdraws, requestWithdraw } = useStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("");

  const userWithdraws = withdraws.filter(w => w.userId === currentUser?.id);

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    
    if (numAmount < 10000) return toast.error("Minimal penarikan Rp10.000");
    if (numAmount > (currentUser?.balance || 0)) return toast.error("Saldo tidak mencukupi");
    if (!method) return toast.error("Pilih metode penarikan");

    let details = "";
    if (method === "Bank") {
      if (!currentUser?.bankInfo?.accountNumber) return toast.error("Lengkapi info bank di profil");
      details = `${currentUser.bankInfo.bankName} - ${currentUser.bankInfo.accountNumber} (${currentUser.bankInfo.accountHolder})`;
    } else {
      if (!currentUser?.walletInfo?.number) return toast.error("Lengkapi info e-wallet di profil");
      details = `${currentUser.walletInfo.provider} - ${currentUser.walletInfo.number}`;
    }

    const success = requestWithdraw(numAmount, method, details);
    if (success) {
      toast.success("Permintaan withdraw berhasil dikirim!");
      setIsModalOpen(false);
      setAmount("");
    } else {
      toast.error("Gagal mengirim permintaan withdraw.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riwayat Withdraw</h1>
          <p className="text-muted-foreground">Pantau status penarikan saldo komisi Anda.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tarik Saldo
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Saldo Tersedia</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
              <Wallet className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold">{formatCurrency(currentUser?.balance || 0)}</h2>
            <p className="text-sm text-muted-foreground mt-2">Minimal penarikan Rp10.000</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Daftar Penarikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="h-12 px-4 text-left font-medium">Tanggal</th>
                    <th className="h-12 px-4 text-left font-medium">Jumlah</th>
                    <th className="h-12 px-4 text-left font-medium">Metode</th>
                    <th className="h-12 px-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userWithdraws.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="h-24 text-center text-muted-foreground italic">
                        Belum ada riwayat penarikan.
                      </td>
                    </tr>
                  ) : (
                    userWithdraws.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((wd) => (
                      <tr key={wd.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-muted-foreground">{new Date(wd.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 font-bold">{formatCurrency(wd.amount)}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-medium">{wd.method}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{wd.details}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={
                            wd.status === 'approved' ? 'success' : 
                            wd.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {wd.status.toUpperCase()}
                          </Badge>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tarik Saldo Komisi">
        <form onSubmit={handleRequest} className="space-y-4">
          <div className="p-4 rounded-lg bg-muted flex justify-between items-center">
            <span className="text-sm">Saldo Anda:</span>
            <span className="font-bold">{formatCurrency(currentUser?.balance || 0)}</span>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Jumlah Penarikan</label>
            <Input 
              type="number" 
              placeholder="Minimal 10000" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Metode Penarikan</label>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              required
            >
              <option value="">-- Pilih Metode --</option>
              <option value="Bank">Transfer Bank</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>
          
          {method === "Bank" && !currentUser?.bankInfo?.accountNumber && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Info bank belum lengkap. Atur di menu Profil.
            </p>
          )}
          {method === "E-Wallet" && !currentUser?.walletInfo?.number && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Info e-wallet belum lengkap. Atur di menu Profil.
            </p>
          )}

          <Button type="submit" className="w-full mt-4">Kirim Permintaan</Button>
        </form>
      </Modal>
    </div>
  );
}
