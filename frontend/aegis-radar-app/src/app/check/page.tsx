"use client";

import { useState } from "react";

export default function BackendTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDetect = async () => {
    setLoading(true);
    setError(null);

    const payload = {
  transaction_id: `TX-${Date.now()}`,
  merchant: "Test Merchant EG",
  amount: Math.floor(Math.random() * 12000) + 500,
  timestamp: new Date().toISOString(),
  customer_id: "CUST-TEST123",
  ip_address: "197.61.45.123",
  device_type: "Mobile"
};

    try {
      const res = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 font-mono bg-[#c0c0c0] min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Backend Test Page</h1>
      
      <button
        onClick={testDetect}
        disabled={loading}
        className="px-6 py-3 bg-[#000080] text-white font-bold mb-6"
      >
        {loading ? "Testing..." : "Send Test Transaction to /detect"}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-500 p-4 mb-4">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="bg-white p-6 border-2 border-black">
          <h2 className="font-bold mb-3">Response from Backend:</h2>
          <pre className="bg-black text-green-400 p-4 overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <p className="mt-8 text-sm text-gray-600">
        Go to: <strong>http://localhost:3000/check</strong>
      </p>
    </div>
  );
}