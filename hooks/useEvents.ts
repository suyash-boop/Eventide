import { useState, useEffect } from 'react';

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

        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error('Event not found');
        }

        const data = await response.json();
        if (data.success) {
          setEvent(data.data.event);
        } else {
          throw new Error(data.error || 'Failed to load event');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  return { event, loading, error };
}