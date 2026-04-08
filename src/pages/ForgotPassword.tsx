import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/Card";
import { useStore } from "../store";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

export default function ForgotPassword() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const { users } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return toast.error("Email harus diisi.");
    
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user = users.find(u => u.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (user) {
        setIsSent(true);
        toast.success("Link reset password telah dikirim ke email Anda.");
      } else {
        toast.error("Email tidak terdaftar.");
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" className="p-0 h-8 w-8" onClick={() => navigate("/login")}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-2xl">Lupa Password</CardTitle>
            </div>
            <CardDescription>
              {isSent 
                ? "Silakan cek email Anda untuk melanjutkan proses reset password." 
                : "Masukkan email Anda untuk menerima link reset password."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Mengirim..." : "Kirim Link Reset"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Kami telah mengirimkan instruksi reset password ke <strong>{email}</strong>.
                </p>
                <Button variant="outline" className="w-full" onClick={() => navigate(`/reset-password?email=${email}`)}>
                  Simulasi: Buka Halaman Reset
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              Ingat password? <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
