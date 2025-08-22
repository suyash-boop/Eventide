"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, Users, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { useEvents } from "@/hooks/useEvents";
import { Event } from "@/lib/api";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  // Use the API hook
  const { events, loading, error, refetch } = useEvents({
    search: searchQuery,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    eventType: typeFilter === "all" ? undefined : typeFilter,
    sortBy: sortBy,
    page: 1,
    limit: 20
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Events</h1>
          <p className="text-gray-400">Find amazing events happening around you</p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search events, topics, or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 focus:border-zinc-700"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Music">Music</SelectItem>
                  <SelectItem value="Food">Food</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="IN_PERSON">In-Person</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 bg-zinc-900/50 border-zinc-800 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex gap-2">
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="bg-zinc-800 text-white border-zinc-700">
                {categoryFilter}
                <button 
                  onClick={() => setCategoryFilter("all")}
                  className="ml-2 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            )}
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="bg-zinc-800 text-white border-zinc-700">
                {typeFilter === "IN_PERSON" ? "In-Person" : typeFilter === "ONLINE" ? "Online" : "Hybrid"}
                <button 
                  onClick={() => setTypeFilter("all")}
                  className="ml-2 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="bg-zinc-800 text-white border-zinc-700">
                "{searchQuery}"
                <button 
                  onClick={() => setSearchQuery("")}
                  className="ml-2 hover:text-red-400"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-400">Failed to load events: {error}</p>
              <Button 
                onClick={refetch}
                variant="outline" 
                size="sm"
                className="border-red-700 text-red-400 hover:bg-red-900/30"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex items-center gap-3 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading events...</span>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="mb-4">
            <p className="text-gray-400">
              {events.length} event{events.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && events.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && events.length === 0 && (
          <div className="text-center py-16">
            <div className="w-32 h-32 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Search className="w-16 h-16 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || categoryFilter !== "all" || typeFilter !== "all" 
                ? "Try adjusting your search criteria or filters" 
                : "No events have been created yet"}
            </p>
            <div className="flex gap-3 justify-center">
              {(searchQuery || categoryFilter !== "all" || typeFilter !== "all") && (
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setTypeFilter("all");
                  }}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Clear all filters
                </Button>
              )}
              <Button asChild className="bg-white text-black hover:bg-gray-200">
                <Link href="/events/create">
                  Create First Event
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const organizerName = typeof event.organizer === 'string' 
    ? event.organizer 
    : event.organizer.name;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 transition-all duration-200 hover:bg-zinc-900/60 overflow-hidden">
      {/* Event Image */}
      <div className="relative h-48 bg-zinc-800/50">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-zinc-600" />
          </div>
        )}
        
        {/* Event Type Badge */}
        <div className="absolute top-3 right-3">
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

      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg leading-tight">{event.title}</CardTitle>
        <Badge variant="outline" className="w-fit text-xs border-zinc-700 text-zinc-300">
          {event.category}
        </Badge>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-300">
            <Clock className="w-4 h-4 mr-2 text-zinc-500" />
            {formatDate(new Date(event.startDate))}
          </div>
          
          <div className="flex items-center text-sm text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
            {event.location}
          </div>
          
          <div className="flex items-center text-sm text-gray-300">
            <Users className="w-4 h-4 mr-2 text-zinc-500" />
            {event.attendeeCount} attending
            {event.maxAttendees && ` • ${event.maxAttendees - event.attendeeCount} spots left`}
          </div>
        </div>

        {/* Organizer */}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <p className="text-xs text-zinc-400">Organized by</p>
          <p className="text-sm text-zinc-300 font-medium">{organizerName}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <Button asChild variant="outline" size="sm" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
            <Link href={`/events/${event.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}