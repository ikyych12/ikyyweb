import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/Card";
import { useStore } from "../store";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [refCode, setRefCode] = React.useState(searchParams.get("ref") || "");
  const { register } = useStore();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = register(email, username, password, refCode);
    if (result.user) {
      toast.success("Registrasi berhasil! Silakan login.");
      navigate("/login");
    } else {
      toast.error(result.error || "Terjadi kesalahan saat registrasi.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Daftar Akun</CardTitle>
            <CardDescription className="text-center">
              Buat akun baru untuk mulai menggunakan BlastWA
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="username">Username</label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="password">Password</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="refCode">Kode Referral (Opsional)</label>
                <Input
                  id="refCode"
                  placeholder="KODE123"
                  value={refCode}
                  onChange={(e) => setRefCode(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground italic">
                  * Gunakan kode referral Admin untuk mendapatkan bonus saldo Rp 2.000 saat mendaftar.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full">Daftar</Button>
              <div className="text-sm text-center text-muted-foreground">
                Sudah punya akun?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Login di sini
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
