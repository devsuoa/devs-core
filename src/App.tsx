import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Construction from "./pages/Construction";
import Links from "./pages/Links";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MarketingPortal from "./pages/admin/MarketingPortal";
import ManageLinks from "./pages/admin/ManageLinks";
import { posthog, isInitialized } from "./lib/posthog";

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (isInitialized) {
      posthog.capture("$pageview", {
        $current_url: window.location.href,
        $pathname: location.pathname,
      });
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <PageViewTracker />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Construction />} />
          <Route path="/links" element={<Links />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/marketing-request" element={<MarketingPortal />} />
          <Route path="/admin/manage-links" element={<ManageLinks />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
