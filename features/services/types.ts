/**
 * Shared types for service-related components
 */

export interface Section {
  id: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  repeat: string;
  staffId: string;
  daysOfWeek: string[];
  recurringDates?: Date[];
}




