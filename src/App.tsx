import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { registerNavigator } from "./lib/pageNotFoundController";
import { posthog, isInitialized } from "./lib/posthog";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CookieDisclaimer from "./components/CookiesDisclaimer";
// import Construction from "./pages/Construction";
import Links from "./pages/Links";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminResetPassword from "./pages/admin/AdminResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import MarketingPortal from "./pages/admin/MarketingPortal";
import ManageLinks from "./pages/admin/ManageLinks";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import PageNotFound from "./pages/PageNotFound";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Events from "./pages/Events";
import ManageEvents from "./pages/admin/ManageEvents";
import Sponsors from "./pages/Sponsors";
import Team from "./pages/Team";
import Pb from "./pages/hidden/Pb";
import KartikGlazer from "./pages/hidden/KartikGlazer";
import Landing from "./pages/Landing";
import Contact from "./pages/Contact";
import MemberRegistry from "./pages/admin/MemberRegistry";
import About from "./pages/About";
import EventsDashboard from "./pages/admin/EventsDashboard";
import TaskTracker from "./pages/admin/TaskTracker";
import QRCode from "./pages/QRCode";
import AdminCMSAuditLog from "./pages/admin/AdminCMSAuditLog";
import EventTodo from "./pages/admin/EventTodo";

function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
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
  const navigate = useNavigate();

  useEffect(() => {
    registerNavigator(navigate);
  }, [navigate]);

  return (
    <>
      <PageViewTracker />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{ zIndex: 100000 }}
      />
      <CookieDisclaimer />
      <main className="min-h-screen">
        <Routes>
          {/* Main pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<Home />} />
          <Route path="/join" element={<Signup />} />
          <Route path="/links" element={<Links />} />
          <Route path="/events" element={<Events />} />
          <Route path="/team" element={<Team />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/sponsors" element={<Sponsors />} />

          {/* Admin pages */}
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/reset-password"
            element={<AdminResetPassword />}
          />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route
            path="/admin/marketing-request"
            element={<MarketingPortal />}
          />
          <Route path="/admin/manage-links" element={<ManageLinks />} />
          <Route path="/admin/manage-events" element={<ManageEvents />} />
          <Route path="/admin/members" element={<MemberRegistry />} />
          <Route path="/admin/tasks" element={<TaskTracker />} />
          <Route path="/admin/event-attendees" element={<EventsDashboard />} />
          <Route path="/admin/audit-log" element={<AdminCMSAuditLog />} />
          <Route path="/admin/event-todo" element={<EventTodo />} />
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* Utility pages */}
          <Route path="/qr-code" element={<QRCode />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/404" element={<PageNotFound />} />

          {/* Hidden pages for jokes & glazing */}
          <Route path="/p/b/6/7" element={<Pb />} />
          <Route path="/p/kartik" element={<KartikGlazer />} />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
