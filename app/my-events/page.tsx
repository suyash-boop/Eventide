"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Users, Plus, Edit3, Trash2, Eye, Clock, MapPin, DollarSign, UserCheck, Settings, Loader2, CheckCircle, XCircle, AlertCircle, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  eventType: string;
  category: string;
  attendeeCount: number;
  maxAttendees?: number;
  price: number;
  organizerId: string;
  image?: string;
  tags: string[];
  isPublic: boolean;
  requireApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Registration {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST';
  createdAt: string;
  event: Event;
}

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("registered");
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch user's events
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserEvents();
    }
  }, [session]);

  const fetchUserEvents = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log('Fetching events for user:', session?.user?.email);
      
      // Fetch hosting events
      const hostingResponse = await fetch('/api/user/events/hosting');
      console.log('Hosting response status:', hostingResponse.status);
      
      if (hostingResponse.ok) {
        const hostingData = await hostingResponse.json();
        console.log('Hosting data:', hostingData);
        setHostingEvents(hostingData.data?.events || []);
      } else {
        const errorData = await hostingResponse.json();
        console.error('Hosting events error:', errorData);
      }

      // Fetch registered events
      const registrationsResponse = await fetch('/api/user/events/registrations');
      console.log('Registrations response status:', registrationsResponse.status);
      
      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        console.log('Registrations data:', registrationsData);
        setRegisteredEvents(registrationsData.data?.registrations || []);
      } else {
        const errorData = await registrationsResponse.json();
        console.error('Registrations error:', errorData);
      }
      
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHostingEvents(prev => prev.filter(event => event.id !== eventId));
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleCancelRegistration = async (registrationId: string) => {
    if (!confirm('Are you sure you want to cancel your registration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRegisteredEvents(prev => prev.filter(reg => reg.id !== registrationId));
      } else {
        throw new Error('Failed to cancel registration');
      }
    } catch (error) {
      console.error('Error canceling registration:', error);
      alert('Failed to cancel registration');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'WAITLIST':
        return <Clock className="w-4 h-4 text-blue-500" />;
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

  const HostingEventCard = ({ event }: { event: Event }) => (
    <Card className="bg-zinc-900/40 border-zinc-800/50 group hover:bg-zinc-900/60 transition-colors">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Event Image/Icon */}
          <div className="h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-lg flex items-center justify-center">
            {event.image ? (
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <h3 className="text-lg font-bold text-white text-center px-2 line-clamp-2">
                {event.title}
              </h3>
            )}
          </div>

          {/* Event Details */}
          <div>
            <h4 className="font-semibold text-white mb-2 line-clamp-2">{event.title}</h4>
            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{formatTime(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>{event.attendeeCount} attending</span>
                {event.maxAttendees && (
                  <span>• {event.maxAttendees - event.attendeeCount} spots left</span>
                )}
              </div>
              {event.price > 0 && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3" />
                  <span>${event.price}</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Status */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">
              {event.category}
            </Badge>
            <div className="flex gap-2">
              {event.requireApproval && (
                <Badge variant="outline" className="border-yellow-700 text-yellow-400">
                  Approval Required
                </Badge>
              )}
              <Badge 
                variant={new Date(event.startDate) > new Date() ? "default" : "secondary"}
                className={new Date(event.startDate) > new Date() ? "bg-green-600" : "bg-gray-600"}
              >
                {new Date(event.startDate) > new Date() ? 'Upcoming' : 'Past'}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button asChild size="sm" variant="outline" className="flex-1 border-zinc-700 text-white hover:bg-zinc-800">
              <Link href={`/events/${event.id}`}>
                <Eye className="w-3 h-3 mr-1" />
                View
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <Link href={`/events/${event.id}/edit`}>
                <Edit3 className="w-3 h-3" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="border-blue-700 text-blue-400 hover:bg-blue-900/20">
              <Link href={`/events/${event.id}/manage`}>
                <Settings className="w-3 h-3" />
              </Link>
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-red-700 text-red-400 hover:bg-red-900/20"
              onClick={() => handleDeleteEvent(event.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RegisteredEventCard = ({ registration }: { registration: Registration }) => {
    const event = registration.event;
    
    return (
      <Card className="bg-zinc-900/40 border-zinc-800/50 group hover:bg-zinc-900/60 transition-colors">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Event Image/Icon */}
            <div className="h-32 bg-gradient-to-br from-blue-500 via-teal-500 to-green-500 rounded-lg flex items-center justify-center">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <h3 className="text-lg font-bold text-white text-center px-2 line-clamp-2">
                  {event.title}
                </h3>
              )}
            </div>

            {/* Event Details */}
            <div>
              <h4 className="font-semibold text-white mb-2 line-clamp-2">{event.title}</h4>
              <div className="space-y-1 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(event.startDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>{event.attendeeCount} attending</span>
                </div>
                {event.price > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3" />
                    <span>${event.price}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Status */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {event.category}
              </Badge>
              <div className="flex items-center gap-2">
                {getStatusIcon(registration.status)}
                <Badge className={`${getStatusColor(registration.status)} text-white`}>
                  {registration.status.charAt(0) + registration.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button asChild size="sm" variant="outline" className="flex-1 border-zinc-700 text-white hover:bg-zinc-800">
                <Link href={`/events/${event.id}`}>
                  <Eye className="w-3 h-3 mr-1" />
                  View Event
                </Link>
              </Button>
              {registration.status !== 'REJECTED' && new Date(event.startDate) > new Date() && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-700 text-red-400 hover:bg-red-900/20"
                  onClick={() => handleCancelRegistration(registration.id)}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading events...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">My Events</h1>
          <Button asChild className="bg-white text-black hover:bg-gray-200 w-fit">
            <Link href="/events/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400">{error}</p>
            <Button 
              onClick={fetchUserEvents} 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-700 text-red-400 hover:bg-red-900/20"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Events Hosting</p>
                  <p className="text-2xl font-bold text-white">{hostingEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Registered Events</p>
                  <p className="text-2xl font-bold text-white">{registeredEvents.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Attendees</p>
                  <p className="text-2xl font-bold text-white">
                    {hostingEvents.reduce((sum, event) => sum + event.attendeeCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending Approvals</p>
                  <p className="text-2xl font-bold text-white">
                    {registeredEvents.filter(reg => reg.status === 'PENDING').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
            <TabsTrigger value="registered" className="data-[state=active]:bg-zinc-800">
              My Registrations ({registeredEvents.length})
            </TabsTrigger>
            <TabsTrigger value="hosting" className="data-[state=active]:bg-zinc-800">
              Events Hosting ({hostingEvents.length})
            </TabsTrigger>
          </TabsList>

          {/* Registered Events Tab */}
          <TabsContent value="registered" className="space-y-6">
            {registeredEvents.length === 0 ? (
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardContent className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">No Registered Events</h3>
                      <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        You haven't registered for any events yet. Discover amazing events happening around you and connect with like-minded people!
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Button asChild className="bg-white text-black hover:bg-gray-200 w-full">
                        <Link href="/discover">
                          <Compass className="w-4 h-4 mr-2" />
                          Discover Events
                        </Link>
                      </Button>
                      <p className="text-sm text-gray-500">
                        Find concerts, workshops, meetups, and more
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map((registration) => (
                  <RegisteredEventCard key={registration.id} registration={registration} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Hosting Events Tab */}
          <TabsContent value="hosting" className="space-y-6">
            {hostingEvents.length === 0 ? (
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardContent className="text-center py-20">
                  <div className="max-w-md mx-auto">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">No Events Created</h3>
                      <p className="text-gray-400 text-lg leading-relaxed mb-8">
                        Ready to bring people together? Create your first event and start building an amazing community experience.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Button asChild className="bg-white text-black hover:bg-gray-200 w-full">
                        <Link href="/events/create">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Event
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 w-full">
                        <Link href="/discover">
                          <Search className="w-4 h-4 mr-2" />
                          Browse Events for Inspiration
                        </Link>
                      </Button>
                      <p className="text-sm text-gray-500">
                        Get inspired by seeing what others are creating
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hostingEvents.map((event) => (
                  <HostingEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}