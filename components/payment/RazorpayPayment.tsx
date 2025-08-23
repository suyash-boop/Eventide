"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, IndianRupee, Shield, CreditCard } from "lucide-react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentProps {
  eventId: string;
  eventTitle: string;
  eventPrice: number;
  organizerName: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (error: any) => void;
  disabled?: boolean;
}

export function RazorpayPayment({
  eventId,
  eventTitle,
  eventPrice,
  organizerName,
  onSuccess,
  onFailure,
  disabled = false
}: RazorpayPaymentProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        onFailure({ message: "Payment gateway could not be loaded" });
      };
      document.body.appendChild(script);
    };

    loadRazorpay();
  }, [onFailure]);

  const initializePayment = async () => {
    if (!razorpayLoaded || !window.Razorpay) {
      onFailure({ message: "Razorpay is not loaded. Please check your internet connection." });
      return;
    }

    setLoading(true);

    try {
      // Calculate amounts (convenience fee + GST)
      const baseAmount = eventPrice;
      const convenienceFee = Math.max(29, Math.round(baseAmount * 0.03)); // 3% or minimum ₹29
      const subtotal = baseAmount + convenienceFee;
      const gstAmount = Math.round(subtotal * 0.18); // 18% GST
      const totalAmount = subtotal + gstAmount;
      const totalAmountPaisa = totalAmount * 100; // Convert to paisa for Razorpay

      // Create order on your backend
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          amount: totalAmountPaisa,
          currency: 'INR'
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_gx221iz91bEkBt", // Use your test key
        amount: totalAmountPaisa,
        currency: "INR",
        name: "Eventide",
        description: `Registration for: ${eventTitle}`,
        order_id: orderData.data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on your backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              onSuccess(response.razorpay_payment_id);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onFailure(error);
          }
        },
        prefill: {
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          contact: ""
        },
        notes: {
          "Event ID": eventId,
          "Event": eventTitle,
          "Base Price": `₹${baseAmount}`,
          "Convenience Fee": `₹${convenienceFee}`,
          "GST (18%)": `₹${gstAmount}`,
          "Total": `₹${totalAmount}`
        },
        theme: {
          color: "#000000"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onFailure({ message: "Payment cancelled by user" });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Payment initialization error:", error);
      onFailure(error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate display amounts
  const baseAmount = eventPrice;
  const convenienceFee = Math.max(29, Math.round(baseAmount * 0.03));
  const subtotal = baseAmount + convenienceFee;
  const gstAmount = Math.round(subtotal * 0.18);
  const totalAmount = subtotal + gstAmount;

  return (
    <div className="space-y-4">
      {/* Price Breakdown */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 space-y-2">
        <h4 className="font-medium text-white mb-3">Price Breakdown</h4>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Event Fee</span>
          <span className="text-white">₹{baseAmount}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Convenience Fee</span>
          <span className="text-white">₹{convenienceFee}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">GST (18%)</span>
          <span className="text-white">₹{gstAmount}</span>
        </div>
        
        <div className="border-t border-zinc-700 pt-2 mt-2">
          <div className="flex justify-between font-medium">
            <span className="text-white">Total Amount</span>
            <span className="text-white">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      {/* Payment Security Info */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by Razorpay</span>
      </div>

      {/* Pay Button */}
      <Button
        onClick={initializePayment}
        disabled={disabled || loading || !razorpayLoaded}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Pay ₹{totalAmount}
          </div>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        By proceeding, you agree to our terms and conditions
      </p>
    </div>
  );
}