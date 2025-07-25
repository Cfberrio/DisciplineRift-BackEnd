/**
 * API Types Module
 *
 * This file contains TypeScript interfaces for all API responses and requests.
 * When integrating with your own API, modify these interfaces to match your API's data structure.
 *
 * CUSTOMIZATION GUIDE:
 * 1. Update field names to match your API's response structure
 * 2. Add or remove fields as needed
 * 3. Adjust types to match your API's data types
 * 4. Consider creating separate interfaces for request and response if they differ
 */

// Shared types for API responses and requests

// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  // Add additional user fields from your API here
  // Example: role: 'admin' | 'user' | 'guest';
}

// Analytics types
export interface AnalyticsMetric {
  id: string
  title: string
  value: number
  change: number
  icon: string
  secondaryValue?: string
  // Add any additional metric fields from your API
  // Example: comparisonPeriod?: string;
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[]
  // Add any additional analytics data from your API
  // Example: period?: { start: string; end: string };
}

// Activity types
export interface ActivityItem {
  id: string
  title: string
  description: string
  timestamp: string
  type: string
  icon?: string
  data?: Record<string, any>
  // Add any additional activity fields from your API
  // Example: priority?: 'high' | 'medium' | 'low';
}

export interface ActivityData {
  items: ActivityItem[]
  // Add any additional activity data from your API
  // Example: pagination?: { page: number; totalPages: number; totalItems: number };
}

// Schedule types
export interface ScheduleEvent {
  id: string
  title: string
  date: string
  time: string
  participants: number
  maxParticipants: number
  // Add any additional event fields from your API
  // Example: location?: string; status?: 'scheduled' | 'cancelled' | 'completed';
}

export interface ScheduleData {
  events: ScheduleEvent[]
  dates: string[]
  // Add any additional schedule data from your API
  // Example: filters?: { locations: string[]; types: string[] };
}

// Service types
export interface Service {
  id: number
  name: string
  price: string
  dateRange: string
  icon: string
  // Additional fields for service details
  description?: string
  location?: string
  participants?: number
  serviceType?: string
  status?: "active" | "inactive" | "ended"
  // Add any additional service fields from your API
  // Example: category?: string; instructorId?: number;
}

// Marketing types
export interface EmailTemplate {
  id: number
  name: string
  description: string
  category: string
  lastModified: string
  content: string
  thumbnail?: string
  attachments: EmailAttachment[]
  // Add any additional template fields from your API
  // Example: variables?: string[]; author?: string;
}

export interface EmailAttachment {
  name: string
  size: string
  type: string
  // Add any additional attachment fields from your API
  // Example: url?: string; id?: string;
}

export interface Automation {
  id: number
  name: string
  description: string
  trigger: string
  schedule: string
  template: string
  templateId: number
  status: "active" | "inactive"
  lastRun: string
  // Add any additional automation fields from your API
  // Example: conditions?: { field: string; operator: string; value: any }[];
}

export interface MarketingMetrics {
  summary: {
    sent: number
    openRate: number
    clickRate: number
    conversionRate: number
    growth: {
      sent: number
      openRate: number
      clickRate: number
      conversionRate: number
    }
  }
  campaigns: {
    id: number
    name: string
    sent: number
    openRate: number
    clickRate: number
    conversionRate: number
  }[]
  deliveryStatus: {
    delivered: number
    pending: number
    bounced: number
  }
  recentSends: {
    id: number
    name: string
    date: string
  }[]
  // Add any additional marketing metrics from your API
  // Example: segmentPerformance?: { segment: string; openRate: number; clickRate: number }[];
}
