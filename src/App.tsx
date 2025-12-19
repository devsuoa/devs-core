import { BrowserRouter, Routes, Route } from "react-router-dom";
import Construction from "./pages/Construction";
import AdminSignup from "./pages/AdminSignup";
import AdminLogin from "./pages/AdminLogin";

function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Construction />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
