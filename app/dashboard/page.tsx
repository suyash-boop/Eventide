"use client";

import { useState } from "react";
import { User, Calendar, Settings, Plus, Edit3, Trash2, Users, Eye, TrendingUp, MapPin, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";

interface DashboardStats {
  totalEvents: number;
  totalAttendees: number;
  upcomingEvents: number;
  totalRevenue: number;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock user data - replace with real auth
  const user = {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    image: null,
    bio: "Event organizer and community builder",
    location: "San Francisco, CA",
    website: "https://johndoe.com",
    joinedDate: "2024-01-15",
    verified: true
  };

  // Fetch user's events
  const { events: allEvents, loading } = useEvents({
    // In real app, filter by organizerId
    page: 1,
    limit: 50
  });

  // Filter events by current user (mock filtering)
  const userEvents = allEvents.filter(event => event.organizerId === user.id);
  
  // Calculate stats
  const stats: DashboardStats = {
    totalEvents: userEvents.length,
    totalAttendees: userEvents.reduce((sum, event) => sum + event.attendeeCount, 0),
    upcomingEvents: userEvents.filter(event => new Date(event.startDate) > new Date()).length,
    totalRevenue: userEvents.reduce((sum, event) => sum + (event.price * event.attendeeCount), 0)
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

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-zinc-700 text-white text-xl">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{user.name}</h1>
                {user.verified && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-400">{user.email}</p>
              {user.location && (
                <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button asChild className="bg-white text-black hover:bg-gray-200">
              <Link href="/events/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Link>
            </Button>
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Attendees</p>
                  <p className="text-2xl font-bold text-white">{stats.totalAttendees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Upcoming Events</p>
                  <p className="text-2xl font-bold text-white">{stats.upcomingEvents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800/50">
            <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-zinc-800">
              My Events ({userEvents.length})
            </TabsTrigger>
            <TabsTrigger value="registrations" className="data-[state=active]:bg-zinc-800">
              Registrations
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-zinc-800">
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Recent Events
                    <Button asChild variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Link href="#" onClick={() => setActiveTab("events")}>
                        View All
                      </Link>
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-4">No events created yet</p>
                      <Button asChild size="sm" className="bg-white text-black hover:bg-gray-200">
                        <Link href="/events/create">Create Your First Event</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{event.title}</h4>
                            <p className="text-sm text-gray-400">
                              {formatDate(event.startDate)} • {event.attendeeCount} attending
                            </p>
                          </div>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                            {event.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button asChild className="w-full bg-white text-black hover:bg-gray-200">
                      <Link href="/events/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Event
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                      <Link href="/discover">
                        <Eye className="w-4 h-4 mr-2" />
                        Browse Events
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">My Events</h2>
              <Button asChild className="bg-white text-black hover:bg-gray-200">
                <Link href="/events/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event
                </Link>
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading events...</p>
              </div>
            ) : userEvents.length === 0 ? (
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardContent className="text-center py-16">
                  <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No events yet</h3>
                  <p className="text-gray-500 mb-6">Create your first event to get started</p>
                  <Button asChild className="bg-white text-black hover:bg-gray-200">
                    <Link href="/events/create">Create Event</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEvents.map((event) => (
                  <Card key={event.id} className="bg-zinc-900/40 border-zinc-800/50 group hover:bg-zinc-900/60 transition-colors">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Event Image/Icon */}
                        <div className="h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-lg flex items-center justify-center">
                          <h3 className="text-lg font-bold text-white text-center px-2">
                            {event.title}
                          </h3>
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
                          </div>
                        </div>

                        {/* Event Status */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                            {event.category}
                          </Badge>
                          <Badge 
                            variant={new Date(event.startDate) > new Date() ? "default" : "secondary"}
                            className={new Date(event.startDate) > new Date() ? "bg-green-600" : "bg-gray-600"}
                          >
                            {new Date(event.startDate) > new Date() ? 'Upcoming' : 'Past'}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button asChild size="sm" variant="outline" className="flex-1 border-zinc-700 text-white hover:bg-zinc-800">
                            <Link href={`/events/${event.id}`}>
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">My Registrations</h2>
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardContent className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No registrations yet</h3>
                <p className="text-gray-500 mb-6">Browse events and register for ones you&apos;re interested in</p>
                <Button asChild className="bg-white text-black hover:bg-gray-200">
                  <Link href="/discover">Browse Events</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Name</label>
                    <p className="text-white">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Email</label>
                    <p className="text-white">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Bio</label>
                    <p className="text-white">{user.bio || 'No bio added'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Location</label>
                    <p className="text-white">{user.location || 'No location added'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Website</label>
                    <p className="text-white">{user.website || 'No website added'}</p>
                  </div>
                  <Button className="w-full bg-white text-black hover:bg-gray-200">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/40 border-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Member Since</label>
                    <p className="text-white">{formatDate(user.joinedDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Account Status</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={user.verified ? "default" : "secondary"} className={user.verified ? "bg-green-600" : "bg-gray-600"}>
                        {user.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                      Privacy Settings
                    </Button>
                    <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-900/20">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}