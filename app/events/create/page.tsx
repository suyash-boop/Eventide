"use client";

import { useState } from "react";
import { Calendar, MapPin, Users, DollarSign, Globe, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
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
  general?: string; // Add this for general errors
}

export default function CreateEventPage() {
  const router = useRouter();
  const { create, loading, error } = useCreateEvent();
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Rename to formData to avoid conflict
  const [formData, setFormData] = useState({
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
  const [enhancing, setEnhancing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [aiFilling, setAiFilling] = useState(false);

  // Add your Groq API key here or use env variable
  const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

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

      setFormData({ ...formData, image: file });
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
    if (!formData.title.trim()) {
      errors.title = "Event title is required";
      isValid = false;
    } else if (formData.title.length > 100) {
      errors.title = "Title must be less than 100 characters";
      isValid = false;
    }

    // Description validation
    if (!formData.description.trim()) {
      errors.description = "Event description is required";
      isValid = false;
    } else if (formData.description.length > 2000) {
      errors.description = "Description must be less than 2000 characters";
      isValid = false;
    }

    // Date and time validation
    if (!formData.startDate) {
      errors.startDate = "Start date is required";
      isValid = false;
    }
    if (!formData.startTime) {
      errors.startTime = "Start time is required";
      isValid = false;
    }
    if (!formData.endDate) {
      errors.endDate = "End date is required";
      isValid = false;
    }
    if (!formData.endTime) {
      errors.endTime = "End time is required";
      isValid = false;
    }

    // Validate dates if all fields are filled
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
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
    if (!formData.location.trim()) {
      errors.location = "Event location is required";
      isValid = false;
    }

    // Category validation
    if (!formData.category) {
      errors.category = "Please select a category";
      isValid = false;
    }

    // Capacity validation
    if (formData.capacity && (isNaN(parseInt(formData.capacity)) || parseInt(formData.capacity) < 1)) {
      errors.capacity = "Capacity must be a positive number";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormErrors({});
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Prepare event data with proper date formatting
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    const eventPayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      location: formData.location.trim(),
      venue: "", // Add venue if you have it in your form
      eventType: formData.eventType,
      category: formData.category,
      maxAttendees: formData.capacity ? parseInt(formData.capacity) : undefined,
      price: formData.price,
      image: imagePreview || "",
      tags: [], // Add tags if you have them
      isPublic: formData.isPublic,
      requireApproval: formData.requireApproval,
      questions: [] // Add questions support later
    };

    console.log('Submitting event:', eventPayload);

    // Create the event
    const result = await create(eventPayload);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push(`/events/${result.eventId}`);
      }, 2000);
    } else {
      setFormErrors({ general: result.error || 'Failed to create event' });
    }
  };

  const enhanceDescription = async () => {
    if (!formData.description.trim()) return;
    setEnhancing(true);

    try {
      const res = await fetch("/api/enhancedescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: formData.description }),
      });
      const data = await res.json();
      if (data.enhanced) {
        setFormData({ ...formData, description: data.enhanced });
      } else {
        alert(data.error || "Failed to enhance description.");
      }
    } catch (err) {
      alert("Failed to enhance description.");
    } finally {
      setEnhancing(false);
    }
  };

  const handleAIFill = async () => {
    if (prompt.trim().split(/\s+/).length < 30) {
      alert("Prompt must be at least 30 words.");
      return;
    }
    setAiFilling(true);
    try {
      const res = await fetch("/api/event-ai-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data && data.fields) {
        setFormData({ ...formData, ...data.fields });
      } else {
        alert(data.error || "AI could not fill the form.");
      }
    } catch (err) {
      alert("Failed to fill form with AI.");
    } finally {
      setAiFilling(false);
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
                    <Calendar className="w-16 h-16 text-white mx-auto mb-4" /> {/* Made calendar white */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {formData.title || "Your Event Title"}
                    </h2>
                    <p className="text-white/80">
                      {formData.category || "Event Category"}
                    </p>
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
            {/* AI Prompt */}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Describe your event (min 30 words)
                <button
                  type="button"
                  className="ml-2 flex items-center gap-1 px-2 py-1 rounded bg-purple-800 hover:bg-purple-700 text-xs text-white"
                  onClick={handleAIFill}
                  disabled={aiFilling || prompt.trim().split(/\s+/).length < 30}
                  title="Let AI fill the form"
                >
                  {aiFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiFilling ? "Filling..." : "Fill with AI"}
                </button>
              </Label>
              <Textarea
                placeholder="Describe your event in detail. The AI will fill the form for you!"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 min-h-24"
                disabled={aiFilling}
              />
              <div className="flex justify-end text-xs text-gray-500">
                {prompt.trim().split(/\s+/).length} words
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Visibility */}
              <div className="flex items-center justify-end">
                <Select 
                  value={formData.isPublic ? "public" : "private"} 
                  onValueChange={(value) => setFormData({ ...formData, isPublic: value === "public" })}
                >
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
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
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
                  value={formData.category} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value });
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
                          value={formData.startDate}
                          onChange={(e) => {
                            setFormData({ ...formData, startDate: e.target.value });
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
                          value={formData.startTime}
                          onChange={(e) => {
                            setFormData({ ...formData, startTime: e.target.value });
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
                          value={formData.endDate}
                          onChange={(e) => {
                            setFormData({ ...formData, endDate: e.target.value });
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
                          value={formData.endTime}
                          onChange={(e) => {
                            setFormData({ ...formData, endTime: e.target.value });
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
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
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
                <Label className="text-gray-400 text-sm flex items-center gap-2">
                  Add Description
                  <button
                    type="button"
                    className="ml-2 flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-purple-300"
                    onClick={enhanceDescription}
                    disabled={enhancing || !formData.description.trim()}
                    title="Enhance with AI"
                  >
                    <Sparkles className="w-4 h-4" />
                    {enhancing ? "Enhancing..." : "Enhance"}
                  </button>
                </Label>
                <Textarea
                  placeholder="What's your event about?"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
                  }}
                  className={`bg-zinc-900/50 border-zinc-800 text-white placeholder:text-gray-500 min-h-24 ${formErrors.description ? 'border-red-500' : ''}`}
                  disabled={enhancing}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  {formErrors.description && (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.description}
                    </span>
                  )}
                  <span className="ml-auto">{formData.description.length}/2000</span>
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
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) => setFormData({ ...formData, requireApproval: checked })}
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
                      value={formData.capacity}
                      onChange={(e) => {
                        setFormData({ ...formData, capacity: e.target.value });
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
              {(error || formErrors.general) && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 font-medium">Failed to create event</p>
                      <p className="text-red-300 text-sm mt-1">{error || formErrors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Button */}
              <Button 
                type="submit"
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
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}