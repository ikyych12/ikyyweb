import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { useStore } from "../store";
import { Users, Copy, Check, Share2, History } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { formatCurrency } from "../lib/utils";

export default function Referral() {
  const { currentUser, referrals } = useStore();
  const [copied, setCopied] = React.useState(false);

  const userReferrals = referrals.filter(r => r.referrerId === currentUser?.id);
  const referralLink = `${window.location.origin}/register?ref=${currentUser?.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUser?.referralCode || "");
    setCopied(true);
    toast.success("Kode referral disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link referral disalin!");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Program Referral</h1>
        <p className="text-muted-foreground">Ajak teman dan dapatkan bonus saldo komisi.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-xl">Kode Referral Anda</CardTitle>
            <CardDescription className="text-primary-foreground/70">Bagikan kode ini ke teman Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Kode Unik</p>
                <h2 className="text-4xl font-black tracking-tighter">{currentUser?.referralCode}</h2>
              </div>
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Link Referral</p>
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="bg-primary-foreground/5 border-primary-foreground/20 text-primary-foreground"
                />
                <Button variant="secondary" onClick={copyLink}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Keuntungan Referral</CardTitle>
            <CardDescription>Dapatkan bonus instan untuk setiap teman yang bergabung.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <Users className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{formatCurrency(500)}</h4>
                <p className="text-sm text-muted-foreground">Bonus per pendaftaran</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground uppercase">Total Teman</p>
                <p className="text-2xl font-bold">{currentUser?.totalReferrals}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground uppercase">Total Bonus</p>
                <p className="text-2xl font-bold">{formatCurrency((currentUser?.totalReferrals || 0) * 500)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="w-5 h-5" />
            Riwayat Referral
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="h-12 px-4 text-left font-medium">Username Teman</th>
                  <th className="h-12 px-4 text-left font-medium">Waktu Daftar</th>
                  <th className="h-12 px-4 text-left font-medium">Bonus</th>
                  <th className="h-12 px-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {userReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground italic">
                      Belum ada teman yang mendaftar menggunakan kode Anda.
                    </td>
                  </tr>
                ) : (
                  userReferrals.map((ref) => (
                    <tr key={ref.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4 font-medium">{ref.referredUsername}</td>
                      <td className="p-4 text-muted-foreground">{new Date(ref.createdAt).toLocaleString()}</td>
                      <td className="p-4 text-emerald-500 font-bold">+{formatCurrency(ref.bonusAmount)}</td>
                      <td className="p-4">
                        <Badge variant="success">Berhasil</Badge>
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
  );
}
