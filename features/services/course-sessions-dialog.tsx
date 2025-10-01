"use client";

import * as React from "react";
import { X, Calendar, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";
import { RepeatSelect } from "@/components/ui/repeat-select";
import { cn } from "@/lib/utils";

interface CourseSession {
  id: string;
  serviceId: string;
  staffId: string;
  startDate: Date;
  startTime: string;
  duration: string;
  repeat: string;
}

interface CourseSessionsDialogProps {
  open: boolean;
  onClose: () => void;
  serviceName: string;
  sessions: CourseSession[];
  onSave: (sessions: CourseSession[]) => void;
}

export function CourseSessionsDialog({
  open,
  onClose,
  serviceName,
  sessions,
  onSave,
}: CourseSessionsDialogProps) {
  const [formData, setFormData] = React.useState({
    serviceId: serviceName,
    staffId: "coach-santiago",
    startDate: new Date(),
    startTime: "11:30 AM",
    duration: "1 hr",
    repeat: "none",
  });

  const [showCalendar, setShowCalendar] = React.useState(false);
  const calendarRef = React.useRef<HTMLDivElement>(null);

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const year = formData.startDate.getFullYear();
    const month = formData.startDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let firstDayOfWeek = firstDayOfMonth.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Convert Sunday from 0 to 7
    firstDayOfWeek -= 1; // Convert to Monday start (0 = Monday)

    const days: Date[] = [];

    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(date);
    }

    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push(date);
    }

    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(date);
    }

    return days;
  };

  const days = generateCalendarDays();
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthName = format(formData.startDate, "MMMM", { locale: es });
  const year = formData.startDate.getFullYear();

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === formData.startDate.getMonth();
  };

  const isSelectedDate = (date: Date) => {
    return (
      date.getDate() === formData.startDate.getDate() &&
      date.getMonth() === formData.startDate.getMonth() &&
      date.getFullYear() === formData.startDate.getFullYear()
    );
  };

  const handleDateSelect = (date: Date) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    setShowCalendar(false);
  };

  const handlePreviousMonth = () => {
    setFormData((prev) => ({
      ...prev,
      startDate: new Date(
        prev.startDate.getFullYear(),
        prev.startDate.getMonth() - 1,
        1
      ),
    }));
  };

  const handleNextMonth = () => {
    setFormData((prev) => ({
      ...prev,
      startDate: new Date(
        prev.startDate.getFullYear(),
        prev.startDate.getMonth() + 1,
        1
      ),
    }));
  };

  const formatSelectedDate = () => {
    return format(formData.startDate, "MMM d, yyyy", { locale: es });
  };

  const handleSave = () => {
    // Here you would generate sessions based on the repeat pattern
    const newSession: CourseSession = {
      id: Date.now().toString(),
      serviceId: formData.serviceId,
      staffId: formData.staffId,
      startDate: formData.startDate,
      startTime: formData.startTime,
      duration: formData.duration,
      repeat: formData.repeat,
    };

    onSave([...sessions, newSession]);
    onClose();
  };

  // Close calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Add course sessions</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Clients book all the sessions in this course together
          </p>

          {/* Service Selection */}
          <div className="space-y-2">
            <Label>Service</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, serviceId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={serviceName}>{serviceName}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                No sessions scheduled yet.
              </span>
            </div>
          </div>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>Staff</Label>
            <Select
              value={formData.staffId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, staffId: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach-santiago">Coach Santiago</SelectItem>
                <SelectItem value="coach-maria">Coach María</SelectItem>
                <SelectItem value="coach-carlos">Coach Carlos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Time Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label>Start Time</Label>
              <div ref={calendarRef} className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatSelectedDate()}
                </Button>

                {showCalendar && (
                  <div className="absolute z-50 mt-1 bg-background border rounded-md shadow-lg p-3 w-80">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePreviousMonth}
                      >
                        <span className="sr-only">Previous month</span>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </Button>

                      <div className="flex items-center gap-2">
                        <span className="font-medium">{monthName}</span>
                        <span className="font-medium">{year}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextMonth}
                      >
                        <span className="sr-only">Next month</span>
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((day) => (
                        <div
                          key={day}
                          className="text-xs text-center font-medium text-muted-foreground h-8 flex items-center justify-center"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day, index) => {
                        const isCurrentMonthDay = isCurrentMonth(day);
                        const isSelected = isSelectedDate(day);

                        return (
                          <button
                            key={index}
                            type="button"
                            className={cn(
                              "h-8 w-8 text-sm rounded-full flex items-center justify-center",
                              isCurrentMonthDay
                                ? "text-foreground hover:bg-muted"
                                : "text-muted-foreground opacity-50",
                              isSelected &&
                                "bg-primary text-primary-foreground font-semibold"
                            )}
                            onClick={() => handleDateSelect(day)}
                            disabled={!isCurrentMonthDay}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <TimePicker
              value={formData.startTime}
              onChange={(time) =>
                setFormData((prev) => ({ ...prev, startTime: time }))
              }
              minHour={13}
              maxHour={16}
              interval={15}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, duration: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 min">30 min</SelectItem>
                <SelectItem value="1 hr">1 hr</SelectItem>
                <SelectItem value="1.5 hrs">1.5 hrs</SelectItem>
                <SelectItem value="2 hrs">2 hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeat */}
          <RepeatSelect
            value={formData.repeat}
            onChange={(repeat) => setFormData((prev) => ({ ...prev, repeat }))}
            label="Repeat"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline">
              Save & Add New
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
