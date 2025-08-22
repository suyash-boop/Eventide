"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Mail,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface RegistrationStatusProps {
  eventId: string;
  onRegister?: () => void;
}

interface Registration {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST';
  createdAt: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    answer: string;
  }>;
}

export default function RegistrationStatus({ eventId, onRegister }: RegistrationStatusProps) {
  const { data: session } = useSession();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (session?.user && eventId) {
      checkRegistrationStatus();
    }
  }, [session, eventId]);

  const checkRegistrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/register`);
      
      if (response.ok) {
        const data = await response.json();
        setIsRegistered(data.data.isRegistered);
        if (data.data.registration) {
          setRegistration(data.data.registration);
        }
      }
    } catch (error) {
      console.error('Error checking registration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'WAITLIST':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-600';
      case 'REJECTED':
        return 'bg-red-600';
      case 'PENDING':
        return 'bg-yellow-600';
      case 'WAITLIST':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Your registration has been approved! You\'re all set for the event.';
      case 'REJECTED':
        return 'Unfortunately, your registration was not approved for this event.';
      case 'PENDING':
        return 'Your registration is pending approval from the event organizer.';
      case 'WAITLIST':
        return 'You\'re on the waitlist. We\'ll notify you if a spot opens up.';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!session?.user) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sign In to Register</h3>
          <p className="text-gray-400 mb-4">Please sign in to register for this event</p>
          <Button className="bg-white text-black hover:bg-gray-200">
            Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Checking registration status...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isRegistered) {
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50">
        <CardContent className="p-6 text-center">
          <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Ready to Register?</h3>
          <p className="text-gray-400 mb-4">Join this event and connect with other attendees</p>
          <Button onClick={onRegister} className="bg-white text-black hover:bg-gray-200">
            Register for Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!registration) {
    return null;
  }

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {getStatusIcon(registration.status)}
          Registration Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-400">Status</Label>
          <Badge className={`${getStatusColor(registration.status)} text-white`}>
            {registration.status}
          </Badge>
        </div>

        <div className="p-4 bg-zinc-800/30 rounded-lg">
          <p className="text-white text-sm">{getStatusMessage(registration.status)}</p>
        </div>

        <div>
          <Label className="text-gray-400">Registered On</Label>
          <p className="text-white mt-1">{formatDate(registration.createdAt)}</p>
        </div>

        {registration.answers.length > 0 && (
          <div>
            <Label className="text-gray-400">Your Responses</Label>
            <div className="space-y-3 mt-2">
              {registration.answers.map((answer, index) => (
                <div key={index} className="p-3 bg-zinc-800/30 rounded-lg">
                  <p className="text-gray-400 text-sm mb-1">{answer.questionText}</p>
                  <p className="text-white">{answer.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {registration.status === 'APPROVED' && (
          <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>You're confirmed for this event!</span>
            </div>
          </div>
        )}

        {registration.status === 'PENDING' && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Waiting for organizer approval</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}