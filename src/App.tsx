import { BrowserRouter, Routes, Route } from "react-router-dom";
import Construction from "./pages/Construction";
import Header from "./components/Header";

function App() {
  return (
    <BrowserRouter>
      <main className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Construction />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
