import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface RegistrationSuccessProps {
  registrationId: string;
}

export default function RegistrationSuccess({ registrationId }: RegistrationSuccessProps) {
  const [checkInCode, setCheckInCode] = useState<string | null>(null);

  useEffect(() => {
    // Fetch registration info from your API
    fetch(`/api/registration/${registrationId}`)
      .then(res => res.json())
      .then(data => setCheckInCode(data.checkInCode));
  }, [registrationId]);

  if (!checkInCode) {
    return <div className="text-gray-400">Loading your QR code...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-lg font-semibold text-green-400">Registration Successful!</div>
      <div className="bg-white p-4 rounded shadow">
        <QRCodeSVG value={checkInCode} size={180} />
      </div>
      <div className="text-gray-500 text-sm text-center">
        Please save or screenshot this QR code.<br />
        You’ll need it to check in at the event.
      </div>
    </div>
  );
}