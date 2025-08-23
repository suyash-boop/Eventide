"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Users, Plus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function HomePage() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
    const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        if (!session) return;
        const fetchRegisteredEvents = async () => {
            setLoadingEvents(true);
            try {
                const res = await fetch("/api/user/events/registrations");
                const data = await res.json();
                console.log('API Response:', data); // Debug log
                
                if (data.success) {
                    // The API might return registrations with event data, so we need to extract events
                    const events = data.data.registrations?.map((registration: any) => ({
                        ...registration.event,
                        status: registration.status
                    })) || [];
                    setRegisteredEvents(events);
                } else {
                    setRegisteredEvents([]);
                }
            } catch (e) {
                console.error('Error fetching registered events:', e);
                setRegisteredEvents([]);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchRegisteredEvents();
    }, [session]);

    if (status === "loading" || loadingEvents) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-white mb-4">Eventide</h1>
                    <p className="text-xl text-gray-300 mb-8">
                        Create, discover and manage events with ease
                    </p>
                    <div className="space-x-4">
                        <Button asChild size="lg">
                            <Link href="/discover">Get Started</Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="border-white/30 text-white hover:bg-white hover:text-black transition-all duration-200"
                        >
                            Learn More
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const now = new Date();
    const upcomingEvents = registeredEvents.filter(
        (event) => new Date(event.startDate) > now
    );
    const pastEvents = registeredEvents.filter(
        (event) => new Date(event.startDate) <= now
    );
    const currentEvents = activeTab === "upcoming" ? upcomingEvents : pastEvents;

    return (
        <div className="min-h-screen bg-black">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-bold text-white">Events</h1>

                    {/* Tab Navigation */}
                    <div className="flex bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab("upcoming")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === "upcoming"
                                    ? "bg-gray-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Upcoming ({upcomingEvents.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("past")}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === "past"
                                    ? "bg-gray-600 text-white"
                                    : "text-gray-400 hover:text-white"
                            }`}
                        >
                            Past ({pastEvents.length})
                        </button>
                    </div>
                </div>

               

                {/* Events Content */}
                {currentEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-32 h-32 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                            <Calendar className="w-16 h-16 text-gray-600" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-400 mb-2">
                            No {activeTab === "upcoming" ? "Upcoming" : "Past"} Events
                        </h2>
                        <p className="text-gray-500 mb-8 text-center max-w-md">
                            {activeTab === "upcoming"
                                ? "You have no upcoming events. Why not register for one?"
                                : "You haven't attended any events yet. Discover events to join!"}
                        </p>
                        <div className="flex gap-4">
                            <Button
                                asChild
                                size="lg"
                                className="bg-gray-700 text-white hover:bg-gray-600"
                            >
                                <Link href="/events/create">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Event
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg">
                                <Link href="/discover">Discover Events</Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentEvents.map((event) => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EventCard({ event }: { event: any }) {
    return (
        <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg">{event.title}</CardTitle>
                    <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === "APPROVED"
                                ? "bg-green-900/50 text-green-400"
                                : event.status === "PENDING"
                                ? "bg-yellow-900/50 text-yellow-400"
                                : "bg-red-900/50 text-red-400"
                        }`}
                    >
                        {event.status}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {event.description}
                </p>

                <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(new Date(event.startDate))} {/* Convert string to Date */}
                    </div>

                    <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                        {event.location}
                    </div>

                    <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                        {event.eventType === "ONLINE"
                            ? "Online Event"
                            : event.eventType === "HYBRID"
                            ? "Hybrid Event"
                            : "In-Person Event"}
                    </div>

                    {event.price > 0 && (
                        <div className="flex items-center text-sm text-gray-300">
                            <Users className="w-4 h-4 mr-2 text-gray-500" />
                            ${event.price}
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                    <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        <Link href={`/events/${event.id}`}>View Details</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
