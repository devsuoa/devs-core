import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { registerNavigator } from "./lib/pageNotFoundController";
import { posthog, isInitialized } from "./lib/posthog";

import Construction from "./pages/Construction";
import Links from "./pages/Links";
import AdminSignup from "./pages/admin/AdminSignup";
import AdminLogin from "./pages/admin/AdminLogin";
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
import Team from "./pages/Team";
import Pb from "./pages/hidden/Pb";
import MemberRegistry from "./pages/admin/MemberRegistry";
import About from "./pages/About";
import EventsDashboard from "./pages/admin/EventsDashboard";
import TaskTracker from "./pages/admin/TaskTracker";

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
  const navigate = useNavigate();

  useEffect(() => {
    registerNavigator(navigate);
  }, [navigate]);

  return (
    <>
      <PageViewTracker />
      <main className="min-h-screen">
        <Routes>
          {/* Main pages */}
          <Route path="/" element={<Construction />} />
          <Route path="/join" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/links" element={<Links />} />
          <Route path="/events" element={<Events />} />
          <Route path="/team" element={<Team />} />
          <Route path="/about" element={<About />} />

          {/* Admin pages */}
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/marketing-request" element={<MarketingPortal />} />
          <Route path="/admin/manage-links" element={<ManageLinks />} />
          <Route path="/admin/manage-events" element={<ManageEvents />} />
          <Route path="/admin/members" element={<MemberRegistry />} />
          <Route path="/admin/tasks" element={<TaskTracker />} />
          <Route path="/admin/event-attendees" element={<EventsDashboard />} />

          {/* Utility pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/404" element={<PageNotFound />} />
          <Route path="*" element={<PageNotFound />} />

          {/* Hidden page for jokes & glazing */}
          <Route path="/p/b/6/7" element={<Pb />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
