import { useState, useEffect, useCallback } from 'react';

interface Question {
  id: string;
  text: string;
  type: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'SELECT' | 'RADIO' | 'CHECKBOX';
  required: boolean;
  options?: string[];
  order: number;
}

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
  organizer: {
    id: string;
    name: string;
    email: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
  questions?: Question[];
}

interface UseEventsParams {
  search?: string;
  category?: string;
  eventType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  eventType: string;
  category: string;
  maxAttendees?: number;
  price: number;
  image?: string;
  tags: string[];
  isPublic: boolean;
  requireApproval: boolean;
  questions?: Question[];
}

export function useEvent(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching event:', eventId);

        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }

        const data = await response.json();
        console.log('Event data received:', data);
        
        if (data.success) {
          console.log('Questions in fetched event:', data.data.event.questions);
          setEvent(data.data.event);
        } else {
          throw new Error(data.error || 'Failed to load event');
        }
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
}

export function useEvents(params: UseEventsParams = {}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const searchParams = new URLSearchParams();
      
      if (params.search) searchParams.append('search', params.search);
      if (params.category) searchParams.append('category', params.category);
      if (params.eventType) searchParams.append('eventType', params.eventType);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(`/api/events?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events || []);
      } else {
        throw new Error(data.error || 'Failed to load events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [params.search, params.category, params.eventType, params.sortBy, params.page, params.limit]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { 
    events, 
    loading, 
    error, 
    refetch: fetchEvents 
  };
}

// Add the missing useCreateEvent hook
export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (eventData: CreateEventData): Promise<{ success: boolean; eventId?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Creating event with data:', eventData);

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      console.log('Create event response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      if (data.success) {
        return { 
          success: true, 
          eventId: data.data.event.id 
        };
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);
      console.error('Error creating event:', err);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  return { 
    create, 
    loading, 
    error 
  };
}

// Add useUpdateEvent hook as well for completeness
export function useUpdateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = async (eventId: string, eventData: Partial<CreateEventData>): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Updating event:', eventId, 'with data:', eventData);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();
      console.log('Update event response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update event');
      }

      if (data.success) {
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to update event');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);
      console.error('Error updating event:', err);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  return { 
    update, 
    loading, 
    error 
  };
}

// Add useDeleteEvent hook as well
export function useDeleteEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteEvent = async (eventId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Deleting event:', eventId);

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('Delete event response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete event');
      }

      if (data.success) {
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to delete event');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      console.error('Error deleting event:', err);
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  return { 
    deleteEvent, 
    loading, 
    error 
  };
}