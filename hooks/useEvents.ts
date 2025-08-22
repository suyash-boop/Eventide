import { useState, useEffect } from 'react';
import { fetchEvents, fetchEventById, createEvent, type Event, type EventsResponse, type CreateEventData } from '@/lib/api';

// Hook for fetching events with filtering
export function useEvents(params: {
  search?: string;
  category?: string;
  eventType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
} = {}) {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchEvents(params);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [JSON.stringify(params)]);

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchEvents(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  return {
    events: data?.events || [],
    pagination: data?.pagination,
    filters: data?.filters,
    loading,
    error,
    refetch
  };
}

// Hook for fetching single event
export function useEvent(id: string | null) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchEventById(id);
        setEvent(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [id]);

  return { event, loading, error };
}

// Hook for creating events
export function useCreateEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async (eventData: CreateEventData): Promise<Event | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await createEvent(eventData);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error };
}