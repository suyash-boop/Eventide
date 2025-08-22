const API_BASE_URL = '/api';

// Mock auth token - in real app, get from auth provider
const getAuthToken = () => {
  // For now, return a mock token
  // In real app: return localStorage.getItem('authToken') or get from auth provider
  return 'mock-auth-token';
};

export interface Event {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  eventType: 'IN_PERSON' | 'ONLINE' | 'HYBRID';
  category: string;
  attendeeCount: number;
  maxAttendees?: number;
  price: number;
  organizer: string | {
    name: string;
    avatar?: string;
    bio?: string;
    followers?: string;
    verified?: boolean;
  };
  organizerId?: string;
  image?: string;
  tags?: string[];
  agenda?: Array<{
    time: string;
    title: string;
    speaker?: string;
    type: string;
  }>;
  isPublic: boolean;
  requireApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  eventType?: string;
  category: string;
  capacity?: string;
  price?: number;
  image?: string;
  isPublic?: boolean;
  requireApproval?: boolean;
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    category: string;
    eventType: string;
    sortBy: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: string[];
}

// Create headers with auth token
const createHeaders = (includeAuth: boolean = false) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Fetch events with filtering and pagination
export async function fetchEvents(params: {
  search?: string;
  category?: string;
  eventType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
} = {}): Promise<EventsResponse> {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`${API_BASE_URL}/events?${searchParams}`, {
    headers: createHeaders()
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch events');
  }

  return result.data;
}

// Fetch single event by ID
export async function fetchEventById(id: string): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    headers: createHeaders()
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch event');
  }

  return result.data.event;
}

// Create new event
export async function createEvent(eventData: CreateEventData): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: 'POST',
    headers: createHeaders(true), // Include auth headers
    body: JSON.stringify(eventData),
  });

  const result = await response.json();
  
  if (!response.ok) {
    const errorMessage = result.details 
      ? `${result.error}: ${result.details.join(', ')}`
      : result.error || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  if (!result.success) {
    const errorMessage = result.details 
      ? `${result.error}: ${result.details.join(', ')}`
      : result.error || 'Failed to create event';
    throw new Error(errorMessage);
  }

  return result.data.event;
}

// Update event
export async function updateEvent(id: string, eventData: Partial<CreateEventData>): Promise<Event> {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'PUT',
    headers: createHeaders(true), // Include auth headers
    body: JSON.stringify(eventData),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to update event');
  }

  return result.data.event;
}

// Delete event
export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: 'DELETE',
    headers: createHeaders(true), // Include auth headers
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || `HTTP error! status: ${response.status}`);
  }

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete event');
  }
}