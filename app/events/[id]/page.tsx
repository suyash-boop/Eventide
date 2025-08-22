"use client";

import { useState } from "react";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, Heart, Bookmark, ExternalLink, Globe, Video, Building, Star, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";

interface EventDetailPageProps {
  params: {
    id: string;
  };
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const router = useRouter();
  const { event, loading, error } = useEvent(params.id);
  const [isAttending, setIsAttending] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading event...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Event Not Found</h1>
          <p className="text-gray-400 mb-6">The event you're looking for doesn't exist.</p>
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Link href="/discover">Browse Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const organizerName = typeof event.organizer === 'string' 
    ? event.organizer 
    : event.organizer.name;

  const organizerImage = typeof event.organizer === 'object' 
    ? event.organizer.image 
    : undefined;

  const organizerBio = typeof event.organizer === 'object' 
    ? event.organizer.bio 
    : undefined;

  const organizerLocation = typeof event.organizer === 'object' 
    ? event.organizer.location 
    : undefined;

  const organizerWebsite = typeof event.organizer === 'object' 
    ? event.organizer.website 
    : undefined;

  const handleAttendEvent = () => {
    setIsAttending(!isAttending);
    // TODO: Make API call to register/unregister for event
  };

  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <Button 
            onClick={() => router.back()}
            variant="ghost" 
            className="text-gray-400 hover:text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="relative h-64 md:h-96 bg-zinc-800/50 rounded-2xl overflow-hidden">
              {event.image ? (
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500">
                  <h2 className="text-4xl md:text-6xl font-bold text-white text-center px-4 break-words">
                    {event.title}
                  </h2>
                </div>
              )}
              
              {/* Event Type Badge */}
              <div className="absolute top-4 right-4">
                <Badge 
                  variant={event.eventType === "ONLINE" ? "default" : "secondary"}
                  className={`${
                    event.eventType === "ONLINE" 
                      ? "bg-blue-600/90 text-white" 
                      : event.eventType === "HYBRID"
                      ? "bg-purple-600/90 text-white"
                      : "bg-green-600/90 text-white"
                  } backdrop-blur-sm`}
                >
                  {event.eventType === "ONLINE" ? "Online" : event.eventType === "HYBRID" ? "Hybrid" : "In-Person"}
                </Badge>
              </div>
            </div>

            {/* Event Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 w-fit">
                    {event.category}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight break-words">
                    {event.title}
                  </h1>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsSaved(!isSaved)}
                    className={`border-zinc-700 ${isSaved ? 'bg-zinc-800 text-yellow-400' : 'text-white hover:bg-zinc-800'}`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShareEvent}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Date and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-5 h-5 mr-3 text-zinc-500" />
                  <div>
                    <p className="font-medium">{formatDate(event.startDate)}</p>
                    <p className="text-sm text-gray-400">
                      {formatTime(event.startDate)} - {formatTime(event.endDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-5 h-5 mr-3 text-zinc-500" />
                  <div>
                    <p className="font-medium">{event.location}</p>
                    {event.venue && (
                      <p className="text-sm text-gray-400">{event.venue}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendees and Price */}
              <div className="flex items-center gap-6 text-gray-300 flex-wrap">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-zinc-500" />
                  <span>{event.attendeeCount} attending</span>
                  {event.maxAttendees && (
                    <span className="text-gray-400"> • {event.maxAttendees - event.attendeeCount} spots left</span>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-white">
                    {event.price === 0 ? "Free" : `$${event.price}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white">About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-zinc-700 text-zinc-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organizer */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white">Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={organizerImage} />
                    <AvatarFallback className="bg-zinc-700 text-white text-lg">
                      {organizerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{organizerName}</h3>
                    {organizerBio && (
                      <p className="text-sm text-gray-400 mt-1 mb-2">{organizerBio}</p>
                    )}
                    {organizerLocation && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {organizerLocation}
                      </p>
                    )}
                    {organizerWebsite && (
                      <a 
                        href={organizerWebsite} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Events */}
            {event.relatedEvents && event.relatedEvents.length > 0 && (
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Related Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.relatedEvents.map((relatedEvent: any) => (
                      <Link 
                        key={relatedEvent.id} 
                        href={`/events/${relatedEvent.id}`}
                        className="block p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <h4 className="font-medium text-white mb-1 line-clamp-2">{relatedEvent.title}</h4>
                        <p className="text-sm text-gray-400">
                          {formatDate(relatedEvent.startDate)} • {relatedEvent.location}
                        </p>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs mt-2">
                          {relatedEvent.category}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="bg-zinc-900/40 border-zinc-800/50 sticky top-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">
                      {event.price === 0 ? "Free" : `$${event.price}`}
                    </p>
                    <p className="text-gray-400">per person</p>
                  </div>

                  <Button 
                    onClick={handleAttendEvent}
                    className={`w-full h-12 text-lg font-medium transition-colors ${
                      isAttending 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    {isAttending ? (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Attending ✓
                      </div>
                    ) : (
                      'Register Now'
                    )}
                  </Button>

                  {event.requireApproval && (
                    <p className="text-xs text-yellow-400 text-center">
                      * Requires organizer approval
                    </p>
                  )}

                  <div className="pt-4 border-t border-zinc-800 text-sm text-gray-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Event Type:</span>
                      <span className="text-white">
                        {event.eventType === "ONLINE" ? "Online" : event.eventType === "HYBRID" ? "Hybrid" : "In-Person"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Capacity:</span>
                      <span className="text-white">
                        {event.maxAttendees ? `${event.maxAttendees} people` : 'Unlimited'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-white">
                        {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))} hours
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Calendar className="w-4 h-4 mr-3 text-zinc-500" />
                  <div className="text-sm">
                    <p className="font-medium">{formatDate(event.startDate)}</p>
                    <p className="text-gray-400">{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-300">
                  <MapPin className="w-4 h-4 mr-3 text-zinc-500" />
                  <div className="text-sm">
                    <p className="font-medium">{event.location}</p>
                    {event.venue && (
                      <p className="text-gray-400">{event.venue}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-gray-300">
                  <Users className="w-4 h-4 mr-3 text-zinc-500" />
                  <div className="text-sm">
                    <p className="font-medium">{event.attendeeCount} people attending</p>
                    {event.maxAttendees && (
                      <p className="text-gray-400">{event.maxAttendees - event.attendeeCount} spots remaining</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-gray-300">
                  <Globe className="w-4 h-4 mr-3 text-zinc-500" />
                  <div className="text-sm">
                    <p className="font-medium">{event.isPublic ? 'Public Event' : 'Private Event'}</p>
                    <p className="text-gray-400">
                      {event.requireApproval ? 'Approval required' : 'Open registration'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}