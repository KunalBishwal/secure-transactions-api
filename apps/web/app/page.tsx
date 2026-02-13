"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type TxSecureRecord = {
  id: string;
  partyId: string;
  createdAt: string;
  payload_nonce: string;
  payload_ct: string;
  payload_tag: string;
  dek_wrap_nonce: string;
  dek_wrapped: string;
  dek_wrap_tag: string;
  alg: "AES-256-GCM";
  mk_version: 1;
};

type DecryptResponse = {
  decryptedPayload: unknown;
};

export default function Home() {
  const [partyId, setPartyId] = useState("party_123");
  const [payload, setPayload] = useState(
    JSON.stringify(
      { amount: 5000, currency: "AED" },
      null,
      2
    )
  );

  const [record, setRecord] = useState<TxSecureRecord | null>(null);
  const [decrypted, setDecrypted] = useState<unknown>(null);
  const [error, setError] = useState("");

  async function handleEncrypt() {
    try {
      setError("");
      setDecrypted(null);

      const parsed = JSON.parse(payload);

      const res = await fetch(`${API_URL}/tx/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          partyId,
          payload: parsed
        })
      });

      if (!res.ok) throw new Error("Encryption failed");

      const data: TxSecureRecord = await res.json();
      setRecord(data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error");
    }
  }

  async function handleDecrypt() {
    if (!record?.id) return;

    try {
      setError("");

      const res = await fetch(
        `${API_URL}/tx/${record.id}/decrypt`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error("Decryption failed");

      const data: DecryptResponse = await res.json();
      setDecrypted(data.decryptedPayload);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Unexpected error");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white px-6 py-16">
      
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold tracking-tight">
          🔐 Secure Transactions
        </h1>
        <p className="text-slate-400 mt-2">
          AES-256-GCM Envelope Encryption Demo
        </p>
      </div>

      {/* Glass Card */}
      <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

        {/* Party ID */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 block mb-2">
            Party ID
          </label>
          <input
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Payload */}
        <div className="mb-6">
          <label className="text-sm text-slate-400 block mb-2">
            JSON Payload
          </label>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleEncrypt}
            className="flex-1 bg-blue-600 hover:bg-blue-700 transition rounded-lg py-3 font-semibold"
          >
            Encrypt & Store
          </button>

          <button
            onClick={handleDecrypt}
            disabled={!record}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition rounded-lg py-3 font-semibold"
          >
            Decrypt
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Encrypted Result */}
        {record && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">
              Encrypted Record
            </h3>
            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs overflow-auto">
              {JSON.stringify(record, null, 2)}
            </pre>
          </div>
        )}

        {/* Decrypted Result */}
        {decrypted !== null && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-emerald-400">
              Decrypted Payload
            </h3>
            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-xs overflow-auto">
              {JSON.stringify(decrypted, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
