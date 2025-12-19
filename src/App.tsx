import { BrowserRouter, Routes, Route } from "react-router-dom";
import Construction from "./pages/Construction";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MarketingPortal from "./pages/admin/MarketingPortal";

function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Construction />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/marketing-request" element={<MarketingPortal />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
