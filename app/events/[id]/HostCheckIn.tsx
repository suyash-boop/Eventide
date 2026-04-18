"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

type HostCheckInProps = {
  eventId: string;
  onCheckedIn?: () => void;
};

export default function HostCheckIn({ eventId, onCheckedIn }: HostCheckInProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const checkingRef = useRef(false);
  const lastScanRef = useRef<string | null>(null);
  const onCheckedInRef = useRef(onCheckedIn);

  const [scanResult, setScanResult] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    onCheckedInRef.current = onCheckedIn;
  }, [onCheckedIn]);

  const checkInCode = useCallback(async (data: string) => {
    if (!data || checkingRef.current) return;

    checkingRef.current = true;
    setIsCheckingIn(true);
    setScanResult(data);
    setFeedback("Checking in...");
    setSuccess(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ checkInCode: data, eventId }),
      });
      const result = await res.json();

      if (result.success) {
        setFeedback("Check-in successful!");
        setSuccess(true);
        onCheckedInRef.current?.();
      } else {
        setFeedback(result.error || "Check-in failed.");
        setSuccess(false);
        setScanResult(null);
        lastScanRef.current = null;
      }
    } catch (error) {
      setFeedback("Check-in failed. Please try again.");
      setSuccess(false);
      setScanResult(null);
      lastScanRef.current = null;
    } finally {
      checkingRef.current = false;
      setIsCheckingIn(false);
    }
  }, [eventId]);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      controlsRef.current?.stop();
      controlsRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setFeedback("Camera is unavailable in this browser or page context.");
        setSuccess(false);
        return;
      }

      try {
        const video = videoRef.current;
        if (!video) {
          return;
        }

        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 500,
          delayBetweenScanSuccess: 1200,
        });

        const controls = await reader.decodeFromConstraints(
          {
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          },
          video,
          (result) => {
            const value = result?.getText();
            if (value && value !== lastScanRef.current) {
              lastScanRef.current = value;
              void checkInCode(value);
            }
          }
        );

        if (cancelled) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setCameraReady(true);
        setFeedback(null);
        setSuccess(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not open camera.";
        setFeedback(`Camera error: ${message}`);
        setSuccess(false);
        setCameraReady(false);
        stopCamera();
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      setCameraReady(false);
      stopCamera();
    };
  }, [checkInCode]);

  const handleCheckIn = async () => {
    setFeedback(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/checkin-by-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, eventId }),
      });
      const result = await res.json();

      if (result.success) {
        setFeedback("Check-in successful!");
        setSuccess(true);
        setEmail("");
        lastScanRef.current = null;
        onCheckedIn?.();
      } else {
        setFeedback(result.error || "Check-in failed.");
        setSuccess(false);
      }
    } catch (error) {
      setFeedback("Check-in failed. Please try again.");
      setSuccess(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-lg border border-zinc-700 bg-black">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-full w-full object-cover"
        />
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-gray-400">
            Starting camera...
          </div>
        )}
      </div>
      <p className="text-center text-xs text-gray-500">
        If the camera does not open, allow camera access in your browser and use localhost or HTTPS.
      </p>
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
        disabled={!email.trim()}
        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded"
      >
        Check In
      </button>
    </div>
  );
}
