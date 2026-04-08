import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useStore } from "../store";
import { UserCircle, Landmark, Wallet, Save } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function Profile() {
  const { currentUser, updateProfile } = useStore();
  
  const [bankName, setBankName] = React.useState(currentUser?.bankInfo?.bankName || "");
  const [accountNumber, setAccountNumber] = React.useState(currentUser?.bankInfo?.accountNumber || "");
  const [accountHolder, setAccountHolder] = React.useState(currentUser?.bankInfo?.accountHolder || "");
  
  const [walletProvider, setWalletProvider] = React.useState(currentUser?.walletInfo?.provider || "");
  const [walletNumber, setWalletNumber] = React.useState(currentUser?.walletInfo?.number || "");

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ bankName, accountNumber, accountHolder }, currentUser?.walletInfo);
    toast.success("Informasi bank berhasil disimpan!");
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(currentUser?.bankInfo, { provider: walletProvider, number: walletNumber });
    toast.success("Informasi E-Wallet berhasil disimpan!");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil & Pengaturan</h1>
        <p className="text-muted-foreground">Kelola informasi akun dan metode pembayaran Anda.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" />
              Informasi Bank
            </CardTitle>
            <CardDescription>Digunakan untuk penarikan saldo komisi ke rekening bank.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveBank}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Bank</label>
                <Input 
                  placeholder="BCA, Mandiri, BNI, dll" 
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor Rekening</label>
                <Input 
                  placeholder="1234567890" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Pemilik Rekening</label>
                <Input 
                  placeholder="John Doe" 
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gap-2">
                <Save className="w-4 h-4" />
                Simpan Rekening
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Informasi E-Wallet
            </CardTitle>
            <CardDescription>Digunakan untuk penarikan saldo komisi ke akun E-Wallet.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveWallet}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider E-Wallet</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={walletProvider}
                  onChange={(e) => setWalletProvider(e.target.value)}
                >
                  <option value="">-- Pilih Provider --</option>
                  <option value="Dana">Dana</option>
                  <option value="OVO">OVO</option>
                  <option value="GoPay">GoPay</option>
                  <option value="LinkAja">LinkAja</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nomor E-Wallet</label>
                <Input 
                  placeholder="08123456789" 
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full gap-2">
                <Save className="w-4 h-4" />
                Simpan E-Wallet
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
