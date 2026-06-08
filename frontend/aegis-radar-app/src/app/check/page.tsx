"use client";

import { useState } from "react";

interface DetectResponse {
  transaction_id: string;
  merchant: string;
  amount: number;
  risk_score: number;
  is_fraud: boolean;
  confidence: number;
  model_version: string;
  message?: string;
  timestamp: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function BackendCheckPage() {
  const [result, setResult] = useState<DetectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"mock" | "ml">("mock");

  const sendTransaction = async () => {
  // Realistic test transactions
  const testTransactions = [
    // Normal transactions
    { merchant: "Amazon EG", amount: 165, category: "electronics", v_1h: 11, v_24h: 22 },
    { merchant: "Jumia", amount: 650, category: "general", v_1h: 10, v_24h: 23 },
    { merchant: "Carrefour", amount: 3334, category: "supermarket", v_1h: 6, v_24h: 9},
    { merchant: "Talabat", amount: 9879, category: "food", v_1h: 2, v_24h: 8 },
    { merchant: "Noon", amount: 18954, category: "electronics", v_1h: 3, v_24h: 3 },
    
    // High risk / suspicious transactions
    { merchant: "Crypto Exchange", amount: 890, category: "crypto", v_1h: 10, v_24h: 39 },
    { merchant: "Online Betting", amount: 2536, category: "gambling", v_1h: 11, v_24h: 28 },
    { merchant: "Luxury Watch Store", amount: 66965, category: "luxury", v_1h: 12, v_24h: 35 },
    { merchant: "Unknown Electronics", amount: 13655, category: "electronics", v_1h: 22, v_24h: 41 },
    { merchant: "International Transfer", amount: 3344, category: "highrisk", v_1h: 13, v_24h: 34 },
  ];

  // Pick random transaction
  const tx = testTransactions[Math.floor(Math.random() * testTransactions.length)];

  const payload = {
    transaction_id: `TX-${Date.now()}`,
    merchant: tx.merchant,
    amount: tx.amount,
    timestamp: new Date().toISOString(),
    customer_id: `CUST-${1000 + Math.floor(Math.random() * 9000)}`,
    ip_address: `156.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    device_type: Math.random() > 0.5 ? "mobile" : "desktop",
    velocity_1h: tx.v_1h,
    velocity_24h: tx.v_24h,
    merchant_category: tx.category
  };

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
   // Increased history size

    console.log("✅ Transaction sent:", result);
  } catch (err) {
    console.error("❌ Failed to send transaction:", err);
  }
};

  return (
    <div className="p-8 font-mono min-h-screen bg-[#c0c0c0]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AEGIS RADAR Backend Test</h1>
        <p className="text-sm text-gray-600 mb-6">Testing connection to FastAPI backend + ML model</p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={sendTransaction}
            disabled={loading}
            className="px-6 py-3 bg-[#000080] text-white font-bold hover:bg-[#0000a0] disabled:opacity-50"
          >
            {loading ? "Sending Transaction..." : "Test /detect Endpoint"}
          </button>

          <button
            onClick={() => setMode(mode === "mock" ? "ml" : "mock")}
            className="px-4 py-3 border-2 border-black font-bold"
          >
            Mode: {mode.toUpperCase()}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-500 p-4 mb-6 text-red-700">
            {error}
            <br />
            <small>Make sure backend is running on http://127.0.0.1:8000</small>
          </div>
        )}

        {result && (
          <div className="bg-white border-2 border-black p-6">
            <h2 className="font-bold text-lg mb-4">✅ Backend Response</h2>
            <pre className="bg-black text-green-400 p-4 overflow-auto text-sm leading-relaxed">
              {JSON.stringify(result, null, 2)}
            </pre>

            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-sm">
              <strong>Status:</strong> {result.is_fraud ? "🚨 FRAUD DETECTED" : "✅ NORMAL"}
              <br />
              <strong>Risk Score:</strong> {(result.risk_score * 100).toFixed(1)}%
            </div>
          </div>
        )}

        <div className="mt-10 text-xs text-gray-600">
          <p>Backend URL: http://127.0.0.1:8000/detect</p>
          <p>Current Mode: {mode === "mock" ? "Mock (Safe)" : "Real ML"}</p>
          <p className="mt-2">Use this page to test every endpoint before connecting full dashboard pages.</p>
        </div>
      </div>
    </div>
  );
}