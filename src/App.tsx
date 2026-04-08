import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import Blast from "./pages/Blast";
import Referral from "./pages/Referral";
import Profile from "./pages/Profile";
import WithdrawHistory from "./pages/WithdrawHistory";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/blast" element={<Blast />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/withdraw-history" element={<WithdrawHistory />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
