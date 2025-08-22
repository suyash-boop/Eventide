"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, DollarSign, Globe, Image as ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateEvent } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";

interface FormErrors {
  title?: string;
  description?: string;
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  location?: string;
  category?: string;
  capacity?: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { create, loading, error } = useCreateEvent();
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    eventType: "IN_PERSON",
    category: "",
    capacity: "",
    price: 0,
    requireApproval: false,
    isPublic: true,
    image: null as File | null
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
      }

      setEventData({ ...eventData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Title validation
    if (!eventData.title.trim()) {
      errors.title = "Event title is required";
      isValid = false;
    } else if (eventData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
      isValid = false;
    }

    // Description validation
    if (!eventData.description.trim()) {
      errors.description = "Event description is required";
      isValid = false;
    } else if (eventData.description.length > 2000) {
      errors.description = "Description must be less than 2000 characters";
      isValid = false;
    }

    // Date and time validation
    if (!eventData.startDate) {
      errors.startDate = "Start date is required";
      isValid = false;
    }
    if (!eventData.startTime) {
      errors.startTime = "Start time is required";
      isValid = false;
    }
    if (!eventData.endDate) {
      errors.endDate = "End date is required";
      isValid = false;
    }
    if (!eventData.endTime) {
      errors.endTime = "End time is required";
      isValid = false;
    }

    // Validate dates if all fields are filled
    if (eventData.startDate && eventData.startTime && eventData.endDate && eventData.endTime) {
      const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
      const endDateTime = new Date(`${eventData.endDate}T${eventData.endTime}`);
      const now = new Date();

      if (startDateTime <= now) {
        errors.startDate = "Start date must be in the future";
        isValid = false;
      }
      if (endDateTime <= startDateTime) {
        errors.endDate = "End date must be after start date";
        isValid = false;
      }
    }

    // Location validation
    if (!eventData.location.trim()) {
      errors.location = "Event location is required";
      isValid = false;
    }

    // Category validation
    if (!eventData.category) {
      errors.category = "Please select a category";
      isValid = false;
    }

    // Capacity validation
    if (eventData.capacity && (isNaN(parseInt(eventData.capacity)) || parseInt(eventData.capacity) < 1)) {
      errors.capacity = "Capacity must be a positive number";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleCreateEvent = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Create the event
    const result = await create({
      title: eventData.title.trim(),
      description: eventData.description.trim(),
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
      location: eventData.location.trim(),
      eventType: eventData.eventType,
      category: eventData.category,
      capacity: eventData.capacity || undefined,
      price: eventData.price,
      isPublic: eventData.isPublic,
      requireApproval: eventData.requireApproval,
      // TODO: Handle image upload to a file storage service
      image: imagePreview || undefined
    });

    if (result) {
      setSuccess(true);
      // Redirect to the created event after a short delay
      setTimeout(() => {
        router.push(`/events/${result.id}`);
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Event Created Successfully!</h1>
          <p className="text-gray-400 mb-4">Redirecting to your event...</p>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Event Preview */}
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Create Event</h1>
            
            {/* Event Image Upload */}
            <Card className="bg-zinc-900/40 border-zinc-800/50 overflow-hidden">
              <div className="relative h-64 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 flex items-center justify-center">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <h2 className="text-4xl font-bold text-white mb-2 transform -rotate-12">
                      {eventData.title || "YOUR"}<br />
                      {eventData.title ? "EVENT" : "EVENT"}<br />
                      {eventData.title ? "HERE" : "TITLE"}
                    </h2>
                  </div>
                )}
                
                {/* Upload Button */}
                <div className="absolute bottom-4 right-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Event Form */}
          <div className="space-y-6">
            {/* Visibility */}
            <div className="flex items-center justify-end">
              <Select value={eventData.isPublic ? "public" : "private"} onValueChange={(value) => setEventData({ ...eventData, isPublic: value === "public" })}>
                <SelectTrigger className="w-32 bg-zinc-900/50 border-zinc-800 text-white">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Name */}
            <div className="space-y-2">
              <Input
                placeholder="Event Name"
                value={eventData.title}
                onChange={(e) => {
                  setEventData({ ...eventData, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: undefined });
                }}
                className={`text-2xl font-bold bg-transparent border-0 text-white placeholder:text-gray-500 px-0 focus-visible:ring-0 ${formErrors.title ? 'border-red-500' : ''}`}
              />
              {formErrors.title && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Category</Label>
              <Select 
                value={eventData.category} 
                onValueChange={(value) => {
                  setEventData({ ...eventData, category: value });
                  if (formErrors.category) setFormErrors({ ...formErrors, category: undefined });
                }}
              >
                <SelectTrigger className={`bg-zinc-900/50 border-zinc-800 text-white ${formErrors.category ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
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
              {formErrors.category && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.category}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Start
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={eventData.startDate}
                        onChange={(e) => {
                          setEventData({ ...eventData, startDate: e.target.value });
                          if (formErrors.startDate) setFormErrors({ ...formErrors, startDate: undefined });
                        }}
                        className={`bg-zinc-900/50 border-zinc-800 text-white ${formErrors.startDate ? 'border-red-500' : ''}`}
                      />
                      {formErrors.startDate && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.startDate}</p>
                      )}
                    </div>
                    <div className="w-32">
                      <Input
                        type="time"
                        value={eventData.startTime}
                        onChange={(e) => {
                          setEventData({ ...eventData, startTime: e.target.value });
                          if (formErrors.startTime) setFormErrors({ ...formErrors, startTime: undefined });
                        }}
                        className={`bg-zinc-900/50 border-zinc-800 text-white ${formErrors.startTime ? 'border-red-500' : ''}`}
                      />
                      {formErrors.startTime && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.startTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    End
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={eventData.endDate}
                        onChange={(e) => {
                          setEventData({ ...eventData, endDate: e.target.value });
                          if (formErrors.endDate) setFormErrors({ ...formErrors, endDate: undefined });
                        }}
                        className={`bg-zinc-900/50 border-zinc-800 text-white ${formErrors.endDate ? 'border-red-500' : ''}`}
                      />
                      {formErrors.endDate && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.endDate}</p>
                      )}
                    </div>
                    <div className="w-32">
                      <Input
                        type="time"
                        value={eventData.endTime}
                        onChange={(e) => {
                          setEventData({ ...eventData, endTime: e.target.value });
                          if (formErrors.endTime) setFormErrors({ ...formErrors, endTime: undefined });
                        }}
                        className={`bg-zinc-900/50 border-zinc-800 text-white ${formErrors.endTime ? 'border-red-500' : ''}`}
                      />
                      {formErrors.endTime && (
                        <p className="text-red-400 text-xs mt-1">{formErrors.endTime}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm text-gray-400">GMT+05:30</span><br />
                <span className="text-sm text-gray-400">Kolkata</span>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Add Event Location
              </Label>
              <Input
                placeholder="Offline location or virtual link"
                value={eventData.location}
                onChange={(e) => {
                  setEventData({ ...eventData, location: e.target.value });
                  if (formErrors.location) setFormErrors({ ...formErrors, location: undefined });
                }}
                className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 ${formErrors.location ? 'border-red-500' : ''}`}
              />
              {formErrors.location && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.location}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Add Description</Label>
              <Textarea
                placeholder="What's your event about?"
                value={eventData.description}
                onChange={(e) => {
                  setEventData({ ...eventData, description: e.target.value });
                  if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
                }}
                className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 min-h-24 ${formErrors.description ? 'border-red-500' : ''}`}
              />
              <div className="flex justify-between text-xs text-gray-500">
                {formErrors.description && (
                  <span className="text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.description}
                  </span>
                )}
                <span className="ml-auto">{eventData.description.length}/2000</span>
              </div>
            </div>

            {/* Event Options */}
            <div className="space-y-4">
              <h3 className="text-white font-medium">Event Options</h3>
              
              {/* Tickets */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-zinc-400" />
                  <span className="text-white">Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                    Free
                  </Badge>
                </div>
              </div>

              {/* Require Approval */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <span className="text-white">Require Approval</span>
                </div>
                <Switch
                  checked={eventData.requireApproval}
                  onCheckedChange={(checked) => setEventData({ ...eventData, requireApproval: checked })}
                />
              </div>

              {/* Capacity */}
              <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <span className="text-white">Capacity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={eventData.capacity}
                    onChange={(e) => {
                      setEventData({ ...eventData, capacity: e.target.value });
                      if (formErrors.capacity) setFormErrors({ ...formErrors, capacity: undefined });
                    }}
                    className={`w-24 bg-transparent border-zinc-700 text-white text-sm ${formErrors.capacity ? 'border-red-500' : ''}`}
                  />
                </div>
              </div>
              {formErrors.capacity && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.capacity}
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-400 font-medium">Failed to create event</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <Button 
              onClick={handleCreateEvent}
              disabled={loading}
              className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg font-medium disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Event...
                </div>
              ) : (
                "Create Event"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}