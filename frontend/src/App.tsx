import { useEffect, useState } from "react";
import { client } from "./config/axios";

export default function App() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    client
      .get("/health")
      .then((res) => setStatus(`Backend OK (${res.status})`))
      .catch(() => setStatus("Backend unreachable"));
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-pink-600">Lenoir Studio</h1>
      <p className="mt-2 text-gray-700">{status}</p>
    </main>
  );
}