"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { 
  Save,
  X,
  Edit3,
  Users, 
  Settings, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  MapPin, 
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Upload,
  Trash2,
  UserCheck,
  UserX,
  Search,
  Filter,
  MoreVertical,
  Download,
  MessageSquare,
  Phone,
  Loader2,
  AlertCircle,
  Info,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import QuestionManager from "@/components/QuestionManager";
import HostCheckIn from "../HostCheckIn";

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
  registrations?: Registration[]; // Add this line
  questions?: Question[]; // Add this if missing
}

interface Registration {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLIST';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
    location?: string;
  };
  answers?: RegistrationAnswer[];
  checkedIn?: boolean;
}

interface RegistrationAnswer {
  id: string;
  questionId: string;
  answer: string;
  question: {
    id: string;
    text: string;
    type: string;
    required: boolean;
  };
}

const EVENT_TYPES = [
  'CONFERENCE', 'WORKSHOP', 'MEETUP', 'WEBINAR', 'PARTY', 'CONCERT', 'SPORTS', 'OTHER'
];

const CATEGORIES = [
  'Technology', 'Business', 'Health', 'Education', 'Entertainment', 
  'Sports', 'Arts', 'Music', 'Food', 'Travel', 'Other'
];

interface EventManagePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EventManagePage({ params }: EventManagePageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  
  const [activeTab, setActiveTab] = useState("details");
  const [event, setEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Registration | null>(null);
  
  // Filters and search for guests
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Fetch event and related data
  useEffect(() => {
    if (session?.user?.email && eventId) {
      fetchEventData();
    }
  }, [session, eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      setError("");

      const eventResponse = await fetch(`/api/events/${eventId}/manage`);
      if (!eventResponse.ok) {
        throw new Error('Event not found or unauthorized');
      }
      
      const eventData = await eventResponse.json();
      console.log('Full API response:', eventData); // Debug log
      
      if (eventData.success) {
        console.log('Setting event:', eventData.data.event);
        console.log('Setting registrations:', eventData.data.event.registrations); // Check this
        
        setEvent(eventData.data.event);
        setEditingEvent(eventData.data.event);
        // Fix: Get registrations from event.registrations, not a separate field
        setRegistrations(eventData.data.event.registrations || []);
      }
      
    } catch (error) {
      console.error('Error fetching event data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!editingEvent) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEvent),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const data = await response.json();
      if (data.success) {
        setEvent(data.data.event);
        setEditingEvent(data.data.event);
        setIsEditing(false);
      }
      
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEvent(event);
    setIsEditing(false);
  };

  const handleRegistrationAction = async (registrationId: string, action: 'approve' | 'reject' | 'waitlist') => {
    setActionLoading(registrationId);
    
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update registration');
      }

      const data = await response.json();
      if (data.success) {
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId 
              ? { ...reg, status: action.toUpperCase() as Registration['status'] }
              : reg
          )
        );
        
        // Update event attendee count if approved
        if (action === 'approve' && event) {
          setEvent(prev => prev ? { ...prev, attendeeCount: prev.attendeeCount + 1 } : null);
        }
      }
      
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('Failed to update registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImageUpload = async (file: File) => {
    // This would integrate with your image upload service
    // For now, we'll just create a URL
    const imageUrl = URL.createObjectURL(file);
    if (editingEvent) {
      setEditingEvent({ ...editingEvent, image: imageUrl });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
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

  const filteredRegistrations = registrations
    .filter(reg => {
      const matchesSearch = reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           reg.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || reg.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.user.name.localeCompare(b.user.name);
        default:
          return 0;
      }
    });

  const stats = {
    total: registrations.length,
    approved: registrations.filter(r => r.status === 'APPROVED').length,
    pending: registrations.filter(r => r.status === 'PENDING').length,
    rejected: registrations.filter(r => r.status === 'REJECTED').length,
    waitlist: registrations.filter(r => r.status === 'WAITLIST').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateForInput = (dateString: string) => {
    return new Date(dateString).toISOString().slice(0, 16);
  };

  useEffect(() => {
    console.log('Event management - Event:', event);
    console.log('Event management - Questions:', event?.questions);
  }, [event]);

  useEffect(() => {
    console.log('Event data:', event);
    console.log('Registrations:', event?.registrations);
    console.log('Registrations count:', event?.registrations?.length);
  }, [event]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading event management...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Event</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/my-events')} className="bg-white text-black hover:bg-gray-200">
            Back to My Events
          </Button>
        </div>
      </div>
    );
  }

  if (!event || !editingEvent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Link href="/my-events" className="hover:text-white">My Events</Link>
            <span>/</span>
            <span>Manage Event</span>
          </div>
          <h1 className="text-3xl font-bold text-white">{event.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">
              {event.category}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-3 mb-8">
          <Button asChild variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Link href={`/events/${event.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              View Public Page
            </Link>
          </Button>
          {!isEditing && (
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Event
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Registrations</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Approved</p>
                  <p className="text-2xl font-bold text-white">{stats.approved}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pending}</p>
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
                  <p className="text-sm text-gray-400">Capacity</p>
                  <p className="text-2xl font-bold text-white">
                    {event.maxAttendees ? `${stats.approved}/${event.maxAttendees}` : stats.approved}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/40 border-zinc-800/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${(stats.approved * event.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-md bg-zinc-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="checkin">CheckIn</TabsTrigger>
          </TabsList>

          {/* Event Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Event Info */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-zinc-900/40 border-zinc-800/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">Basic Information</CardTitle>
                      {isEditing && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={handleSaveEvent}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-gray-400">Event Title *</Label>
                          <Input
                            value={editingEvent.title}
                            onChange={(e) => setEditingEvent({...editingEvent, title: e.target.value})}
                            className="bg-zinc-800/50 border-zinc-700 text-white"
                            disabled={saving}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Description *</Label>
                          <Textarea
                            value={editingEvent.description}
                            onChange={(e) => setEditingEvent({...editingEvent, description: e.target.value})}
                            className="bg-zinc-800/50 border-zinc-700 text-white min-h-[120px]"
                            disabled={saving}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-400">Event Type *</Label>
                            <Select 
                              value={editingEvent.eventType} 
                              onValueChange={(value) => setEditingEvent({...editingEvent, eventType: value})}
                            >
                              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                {EVENT_TYPES.map(type => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0) + type.slice(1).toLowerCase()}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-400">Category *</Label>
                            <Select 
                              value={editingEvent.category} 
                              onValueChange={(value) => setEditingEvent({...editingEvent, category: value})}
                            >
                              <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                {CATEGORIES.map(category => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-400">Start Date & Time *</Label>
                            <Input
                              type="datetime-local"
                              value={formatDateForInput(editingEvent.startDate)}
                              onChange={(e) => setEditingEvent({...editingEvent, startDate: new Date(e.target.value).toISOString()})}
                              className="bg-zinc-800/50 border-zinc-700 text-white"
                              disabled={saving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-400">End Date & Time *</Label>
                            <Input
                              type="datetime-local"
                              value={formatDateForInput(editingEvent.endDate)}
                              onChange={(e) => setEditingEvent({...editingEvent, endDate: new Date(e.target.value).toISOString()})}
                              className="bg-zinc-800/50 border-zinc-700 text-white"
                              disabled={saving}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Location *</Label>
                          <Input
                            value={editingEvent.location}
                            onChange={(e) => setEditingEvent({...editingEvent, location: e.target.value})}
                            className="bg-zinc-800/50 border-zinc-700 text-white"
                            disabled={saving}
                            placeholder="City, State or Online"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-gray-400">Venue</Label>
                          <Input
                            value={editingEvent.venue || ''}
                            onChange={(e) => setEditingEvent({...editingEvent, venue: e.target.value})}
                            className="bg-zinc-800/50 border-zinc-700 text-white"
                            disabled={saving}
                            placeholder="Specific venue name or address"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-gray-400">Price ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingEvent.price}
                              onChange={(e) => setEditingEvent({...editingEvent, price: parseFloat(e.target.value) || 0})}
                              className="bg-zinc-800/50 border-zinc-700 text-white"
                              disabled={saving}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-400">Max Attendees</Label>
                            <Input
                              type="number"
                              min="1"
                              value={editingEvent.maxAttendees || ''}
                              onChange={(e) => setEditingEvent({...editingEvent, maxAttendees: e.target.value ? parseInt(e.target.value) : null})}
                              className="bg-zinc-800/50 border-zinc-700 text-white"
                              disabled={saving}
                              placeholder="Unlimited"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <Label className="text-gray-400">Event Title</Label>
                          <p className="text-white mt-1 text-lg font-semibold">{event.title}</p>
                        </div>

                        <div>
                          <Label className="text-gray-400">Description</Label>
                          <p className="text-white mt-1 leading-relaxed">{event.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">Event Type</Label>
                            <p className="text-white mt-1">{event.eventType}</p>
                          </div>
                          <div>
                            <Label className="text-gray-400">Category</Label>
                            <p className="text-white mt-1">{event.category}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">Start Date</Label>
                            <p className="text-white mt-1">{formatDate(event.startDate)}</p>
                          </div>
                          <div>
                            <Label className="text-gray-400">End Date</Label>
                            <p className="text-white mt-1">{formatDate(event.endDate)}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-400">Location</Label>
                          <p className="text-white mt-1">{event.location}</p>
                        </div>

                        {event.venue && (
                          <div>
                            <Label className="text-gray-400">Venue</Label>
                            <p className="text-white mt-1">{event.venue}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-400">Price</Label>
                            <p className="text-white mt-1">{event.price > 0 ? `$${event.price}` : 'Free'}</p>
                          </div>
                          <div>
                            <Label className="text-gray-400">Max Attendees</Label>
                            <p className="text-white mt-1">{event.maxAttendees || 'Unlimited'}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Event Image & Status */}
              <div className="space-y-6">
                <Card className="bg-zinc-900/40 border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white">Event Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center overflow-hidden">
                        {editingEvent.image ? (
                          <img 
                            src={editingEvent.image} 
                            alt={editingEvent.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>No image uploaded</p>
                          </div>
                        )}
                      </div>
                      
                      {isEditing && (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            className="bg-zinc-800/50 border-zinc-700 text-white"
                            disabled={saving}
                          />
                          <p className="text-xs text-gray-500">
                            Recommended: 1920x1080px, max 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/40 border-zinc-800/50">
                  <CardHeader>
                    <CardTitle className="text-white">Event Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-400">Public Event</Label>
                      {isEditing ? (
                        <Switch
                          checked={editingEvent.isPublic}
                          onCheckedChange={(checked) => setEditingEvent({...editingEvent, isPublic: checked})}
                          disabled={saving}
                        />
                      ) : (
                        <Badge variant={event.isPublic ? "default" : "secondary"}>
                          {event.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-gray-400">Require Approval</Label>
                      {isEditing ? (
                        <Switch
                          checked={editingEvent.requireApproval}
                          onCheckedChange={(checked) => setEditingEvent({...editingEvent, requireApproval: checked})}
                          disabled={saving}
                        />
                      ) : (
                        <Badge variant={event.requireApproval ? "default" : "secondary"}>
                          {event.requireApproval ? 'Required' : 'Automatic'}
                        </Badge>
                      )}
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>Created: {formatDate(event.createdAt)}</p>
                        <p>Updated: {formatDate(event.updatedAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-6">
            {/* Filters */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-zinc-800/50 border-zinc-700 text-white"
                      icon={<Search className="w-4 h-4" />}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48 bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="waitlist">Waitlist</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full md:w-48 bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Guests List */}
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardContent className="p-0">
                <div className="space-y-0">
                  {registrations.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No registrations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filteredRegistrations.map((registration) => (
                        <div key={registration.id} className="flex items-center justify-between p-6 border-b border-zinc-800/50 last:border-b-0 hover:bg-zinc-800/20 transition-colors">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={registration.user.image} />
                              <AvatarFallback className="bg-zinc-700 text-white">
                                {registration.user.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-white">{registration.user.name}</h4>
                                {registration.user.bio && (
                                  <Info className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Mail className="w-3 h-3" />
                                <span>{registration.user.email}</span>
                              </div>
                              {registration.user.location && (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <MapPin className="w-3 h-3" />
                                  <span>{registration.user.location}</span>
                                </div>
                              )}
                              <p className="text-gray-500 text-xs mt-1">
                                Registered {formatDate(registration.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(registration.status)}
                              <Badge className={`${getStatusColor(registration.status)} text-white`}>
                                {registration.status}
                              </Badge>
                            </div>

                            {registration.checkedIn ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-semibold">Checked In</span>
                              </div>
                            ) : registration.status === 'PENDING' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleRegistrationAction(registration.id, 'approve')}
                                  disabled={actionLoading === registration.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {actionLoading === registration.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <UserCheck className="w-3 h-3" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRegistrationAction(registration.id, 'reject')}
                                  disabled={actionLoading === registration.id}
                                  className="border-red-700 text-red-400 hover:bg-red-900/20"
                                >
                                  <UserX className="w-3 h-3" />
                                </Button>
                              </div>
                            )}

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-400 hover:text-white"
                                  onClick={() => setSelectedUser(registration)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12">
                                      <AvatarImage src={registration.user.image} />
                                      <AvatarFallback className="bg-zinc-700 text-white">
                                        {registration.user.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-xl font-semibold">{registration.user.name}</h3>
                                      <p className="text-gray-400">{registration.user.email}</p>
                                    </div>
                                  </DialogTitle>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  {registration.user.bio && (
                                    <div>
                                      <Label className="text-gray-400">Bio</Label>
                                      <p className="text-white mt-1">{registration.user.bio}</p>
                                    </div>
                                  )}
                                  
                                  {registration.user.location && (
                                    <div>
                                      <Label className="text-gray-400">Location</Label>
                                      <p className="text-white mt-1">{registration.user.location}</p>
                                    </div>
                                  )}

                                  <div>
                                    <Label className="text-gray-400">Registration Status</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getStatusIcon(registration.status)}
                                      <Badge className={`${getStatusColor(registration.status)} text-white`}>
                                        {registration.status}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div>
                                    <Label className="text-gray-400">Registration Date</Label>
                                    <p className="text-white mt-1">{formatDate(registration.createdAt)}</p>
                                  </div>

                                  {registration.answers && registration.answers.length > 0 && (
                                    <div>
                                      <Label className="text-gray-400">Registration Answers</Label>
                                      <div className="space-y-3 mt-2">
                                        {registration.answers.map((answer) => (
                                          <div key={answer.id} className="p-3 bg-zinc-800/50 rounded-lg">
                                            <p className="text-sm text-gray-400 mb-1">{answer.question.text}</p>
                                            <p className="text-white">{answer.answer}</p>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <DialogFooter>
                                  <div className="flex gap-2 w-full">
                                    {registration.status === 'PENDING' && (
                                      <>
                                        <Button
                                          onClick={() => handleRegistrationAction(registration.id, 'approve')}
                                          disabled={actionLoading === registration.id}
                                          className="bg-green-600 hover:bg-green-700 text-white flex-1"
                                        >
                                          <UserCheck className="w-4 h-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => handleRegistrationAction(registration.id, 'reject')}
                                          disabled={actionLoading === registration.id}
                                          className="border-red-700 text-red-400 hover:bg-red-900/20 flex-1"
                                        >
                                          <UserX className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="outline"
                                      className="border-zinc-700 text-white hover:bg-zinc-800"
                                    >
                                      <Mail className="w-4 h-4 mr-2" />
                                      Send Message
                                    </Button>
                                  </div>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Registration Questions</h2>
                <p className="text-gray-400 mt-1">
                  Customize the information you collect from attendees during registration
                </p>
              </div>
            </div>

            <QuestionManager
              eventId={resolvedParams.id}
              questions={event?.questions || []}
              onQuestionsUpdate={(updatedQuestions) => {
                // Refresh the event data
                fetchEventData();
              }}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800/50">
              <CardHeader>
                <CardTitle className="text-white text-red-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border border-red-800/50 rounded-lg bg-red-900/10">
                  <h4 className="text-red-400 font-semibold mb-2">Delete Event</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Once you delete an event, there is no going back. Please be certain.
                  </p>
                  <Button variant="outline" className="border-red-700 text-red-400 hover:bg-red-900/20">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CheckIn Tab */}
          <TabsContent value="checkin" className="space-y-6">
            <Card className="bg-zinc-900/40 border-zinc-800/50 max-w-lg mx-auto">
              <CardHeader>
                <CardTitle className="text-white">Event Check-In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  <div className="text-gray-400 text-center mb-2">
                    Scan an attendee's QR code to check them in for this event.<br />
                    Make sure the QR code is clearly visible in the camera.
                  </div>
                  <div className="w-full flex justify-center">
                    <HostCheckIn eventId={event.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}