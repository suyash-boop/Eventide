"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import to avoid SSR issues
const QrReader = dynamic(() => import("react-qr-reader"), { ssr: false });

export default function HostCheckIn({ eventId }: { eventId: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleScan = async (data: string | null) => {
    if (data) {
      // Call your check-in API
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInCode: data, eventId }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback("✅ Check-in successful!");
      } else {
        setFeedback(result.error || "❌ Check-in failed.");
      }
    }
  };

  const handleError = (err: Error) => {
    setFeedback("Camera error: " + err?.message);
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <h2 className="text-lg font-bold text-white">Scan Attendee QR Code</h2>
      <div className="w-full max-w-xs bg-black rounded shadow p-2">
        <QrReader
          onResult={(result, error) => {
            if (!!result) handleScan(result.getText());
            if (!!error) handleError(error as Error);
          }}
          constraints={{ facingMode: "environment" }}
          style={{ width: "100%" }}
        />
      </div>
      {feedback && (
        <div className="mt-4 text-center text-white">{feedback}</div>
      )}
    </div>
  );
}