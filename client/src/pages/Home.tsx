import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("unreachable"));
  }, []);

  return (
    <section>
      <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-ink/70">API status: {status}</p>
    </section>
  );
}
