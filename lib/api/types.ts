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

// Analytics types - Real data from sessions
export interface AnalyticsData {
  sessionsToday: number
  studentsExpected: number
  activeSessions: number
  nextSessionTime: string | null
}

// Activity types - Real enrollment data
export interface ActivityItem {
  id: string
  type: "enrollment"
  studentName: string
  teamName: string
  timestamp: string
  relativeTime: string
}

export interface ActivityData {
  items: ActivityItem[]
}

// Schedule types - Real sessions from today
export interface ScheduleEvent {
  id: string
  title: string
  time: string
  participants: number
  sessionId: string
}

export interface ScheduleData {
  events: ScheduleEvent[]
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

// Today Sessions types - For dashboard main view
export interface TodaySession {
  sessionId: string
  teamId: string
  teamName: string
  schoolName: string
  startTime: string
  endTime: string
  startDateTime: string
  endDateTime: string
  studentCount: number
  status: "active" | "upcoming" | "completed"
}

export interface TodaySessionsData {
  sessions: TodaySession[]
}

export interface SessionStudent {
  studentId: string
  firstName: string
  lastName: string
  grade: string
  level: string | null
}

export interface SessionStudentsData {
  students: SessionStudent[]
}
