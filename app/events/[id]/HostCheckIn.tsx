"use client";
import { useState } from "react";
import { QrReader } from "react-qr-reader";

export default function HostCheckIn({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");

  const handleScan = async (data: string | null) => {
    if (data && data !== scanResult) {
      setScanResult(data);
      setFeedback("Checking in...");
      setSuccess(null);
      // Call your check-in API
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInCode: data, eventId }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback("Check-in successful!");
        setSuccess(true);
      } else {
        setFeedback(result.error || "Check-in failed.");
        setSuccess(false);
      }
    }
  };

  const handleError = (err: Error) => {
    // Only show real camera errors
    if (err && err.message) {
      setFeedback("Camera error: " + err.message);
      setSuccess(false);
    }
  };

  const handleCheckIn = async () => {
    setFeedback(null);
    const res = await fetch("/api/checkin-by-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, eventId }),
    });
    const result = await res.json();
    if (result.success) {
      setFeedback("✅ Check-in successful!");
    } else {
      setFeedback(result.error || "❌ Check-in failed.");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-xs bg-black rounded shadow p-2 border border-zinc-700">
        <QrReader
          onResult={(result, error) => {
            if (!!result) handleScan(result?.text);
            if (!!error) handleError(error as Error);
          }}
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%", minHeight: 280 }}
        />
      </div>
      {feedback && (
        <div
          className={`flex items-center gap-2 mt-2 text-lg font-medium ${
            success === true
              ? "text-green-400"
              : success === false
              ? "text-red-400"
              : "text-gray-300"
          }`}
        >
          <span>{feedback}</span>
        </div>
      )}
      <input
        type="email"
        placeholder="Attendee email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2 rounded bg-zinc-800 text-white border border-zinc-700"
      />
      <button
        onClick={handleCheckIn}
        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded"
      >
        Check In
      </button>
    </div>
  );
}