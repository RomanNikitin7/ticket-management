import { Route, Routes } from "react-router";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
        </Route>
        <Route path="*" element={<p className="text-ink/70">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
