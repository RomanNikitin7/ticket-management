import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router";

function Dashboard() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(data.status))
      .catch((e) => setStatus(`error (${e})`));
  }, []);

  return (
    <section>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">API status: {status}</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6 flex items-center gap-4 border-b pb-3">
        <Link to="/" className="font-bold">Ticket Management</Link>
      </header>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Routes>
    </div>
  );
}
