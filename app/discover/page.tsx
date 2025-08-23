"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Filter, Calendar, MapPin, Users, DollarSign } from "lucide-react";
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
import { useEvents } from "@/hooks/useEvents";
import { useSearch } from "@/contexts/SearchContext";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES = [
  "All",
  "Technology",
  "Business",
  "Arts",
  "Sports",
  "Education", 
  "Health",
  "Music",
  "Food",
  "Other"
];

const EVENT_TYPES = [
  "All",
  "IN_PERSON",
  "ONLINE", 
  "HYBRID"
];

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useSearch();
  
  // Get search from URL params or global state
  const initialSearch = searchParams.get('search') || searchQuery || '';
  
  const [filters, setFilters] = useState({
    search: initialSearch,
    category: "All",
    eventType: "All",
    sortBy: "newest"
  });

  // Update search query when URL params change
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: urlSearch }));
      setSearchQuery(urlSearch);
    }
  }, [searchParams, setSearchQuery]);

  // Fetch events with filters
  const { events, loading, error } = useEvents({
    search: filters.search,
    category: filters.category === "All" ? undefined : filters.category,
    eventType: filters.eventType === "All" ? undefined : filters.eventType,
    sortBy: filters.sortBy,
  });

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setSearchQuery(value);
    
    // Update URL without triggering navigation
    const newParams = new URLSearchParams(searchParams.toString());
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    router.push(`/discover?${newParams.toString()}`, { scroll: false });
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "All",
      eventType: "All", 
      sortBy: "newest"
    });
    setSearchQuery("");
    router.push('/discover', { scroll: false });
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Discover Events</h1>
          <p className="text-gray-400">Find amazing events happening around you</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500" />
            </div>
            <Input
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search events by title, description, or location..."
              className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 focus:border-primary/50"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4 items-center">
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange("category", value)}
            >
              <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.eventType}
              onValueChange={(value) => handleFilterChange("eventType", value)}
            >
              <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "All" ? "All Types" : type.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-800 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>

            {(filters.search || filters.category !== "All" || filters.eventType !== "All") && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="border-zinc-700 text-gray-400 hover:text-white"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {(filters.search || filters.category !== "All" || filters.eventType !== "All") && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="bg-zinc-800 text-white">
                  Search: "{filters.search}"
                </Badge>
              )}
              {filters.category !== "All" && (
                <Badge variant="secondary" className="bg-zinc-800 text-white">
                  Category: {filters.category}
                </Badge>
              )}
              {filters.eventType !== "All" && (
                <Badge variant="secondary" className="bg-zinc-800 text-white">
                  Type: {filters.eventType.replace("_", " ")}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-gray-400">
            {loading ? "Searching..." : `${events.length} events found`}
          </p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-zinc-900/50 border-zinc-800 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-zinc-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-zinc-700 rounded w-full"></div>
                    <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or browse all events
            </p>
            <Button onClick={clearFilters}>Show All Events</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
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
    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all duration-200 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-white text-lg group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <Badge variant={event.price > 0 ? "default" : "secondary"}>
            {event.price > 0 ? `$${event.price}` : "Free"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" />
            {formatDate(new Date(event.startDate))}
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <MapPin className="w-4 h-4 mr-2 text-gray-500" />
            {event.location}
          </div>

          <div className="flex items-center text-sm text-gray-300">
            <Users className="w-4 h-4 mr-2 text-gray-500" />
            {event.attendeeCount} attending
            {event.maxAttendees && ` / ${event.maxAttendees} max`}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-700">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/events/${event.id}`}>View Details</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}