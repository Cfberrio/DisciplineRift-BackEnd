"use client";

import * as React from "react";
import { X, Calendar } from "lucide-react";
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
import { staffApi } from "@/lib/api/staff-api";
import { withRetry } from "@/lib/api/api-retry";
import type { Section } from "./types";

interface Staff {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface SectionDialogProps {
  open: boolean;
  onClose: () => void;
  serviceName: string;
  onSave: (section: Section) => void;
  initialData?: Section | null;
}

const DAYS_OF_WEEK = [
  { key: "Monday", label: "Lun", fullLabel: "Lunes" },
  { key: "Tuesday", label: "Mar", fullLabel: "Martes" },
  { key: "Wednesday", label: "Mié", fullLabel: "Miércoles" },
  { key: "Thursday", label: "Jue", fullLabel: "Jueves" },
  { key: "Friday", label: "Vie", fullLabel: "Viernes" },
  { key: "Saturday", label: "Sáb", fullLabel: "Sábado" },
  { key: "Sunday", label: "Dom", fullLabel: "Domingo" },
];

export function SectionDialog({
  open,
  onClose,
  serviceName,
  onSave,
  initialData,
}: SectionDialogProps) {
  const [formData, setFormData] = React.useState({
    startDate: new Date(),
    endDate: new Date(),
    startTime: "1:00 PM",
    endTime: "2:00 PM",
    repeat: "none",
    staffId: "",
    daysOfWeek: [] as string[],
  });

  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = React.useState(false);
  const [staffError, setStaffError] = React.useState<string | null>(null);
  const [showStartCalendar, setShowStartCalendar] = React.useState(false);
  const [showEndCalendar, setShowEndCalendar] = React.useState(false);
  const startCalendarRef = React.useRef<HTMLDivElement | null>(null);
  const endCalendarRef = React.useRef<HTMLDivElement | null>(null);

  // Fetch staff data when dialog opens
  React.useEffect(() => {
    if (open) {
      fetchStaff();
    }
  }, [open]);

  const fetchStaff = async () => {
    setIsLoadingStaff(true);
    setStaffError(null);
    try {
      console.log("SectionDialog: Fetching staff...");
      
      const staffData = await withRetry(
        () => staffApi.getAll(),
        {
          maxRetries: 3,
          baseTimeout: 60000, // 60 segundos
          retryDelay: 2000,
          onRetry: (attempt, error) => {
            console.log(`SectionDialog: Reintentando cargar coaches (${attempt}/3)...`, error.message);
          },
        }
      );
      
      console.log("SectionDialog: Fetched staff:", staffData);
      setStaff(staffData);
      console.log(`SectionDialog: Successfully loaded ${staffData.length} staff members`);
    } catch (error) {
      console.error("SectionDialog: Error fetching staff:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido al cargar coaches";
      setStaffError(errorMessage);
      setStaff([]);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  // Initialize form data when dialog opens or initialData changes
  React.useEffect(() => {
    if (open) {
      if (initialData) {
        // Parse daysOfWeek from database format
        let parsedDaysOfWeek: string[] = [];
        if (typeof initialData.daysOfWeek === "string") {
          try {
            parsedDaysOfWeek = JSON.parse(initialData.daysOfWeek);
          } catch {
            parsedDaysOfWeek = [initialData.daysOfWeek];
          }
        } else if (Array.isArray(initialData.daysOfWeek)) {
          parsedDaysOfWeek = initialData.daysOfWeek;
        }

        setFormData({
          startDate: initialData.startDate,
          endDate: initialData.startDate, // Default to same as start date
          startTime: initialData.startTime,
          endTime: initialData.endTime || "",
          repeat: initialData.repeat,
          staffId: initialData.staffId,
          daysOfWeek: parsedDaysOfWeek,
        });
      } else {
        // Reset form for new section
        setFormData({
          startDate: new Date(),
          endDate: new Date(),
          startTime: "1:00 PM",
          endTime: "2:00 PM",
          repeat: "none",
          staffId: "",
          daysOfWeek: [],
        });
      }
    }
  }, [open, initialData]);

  // Generate calendar days for current month
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

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

  const startDays = generateCalendarDays(formData.startDate);
  const endDays = generateCalendarDays(formData.endDate);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const isCurrentMonth = (date: Date, referenceDate: Date) => {
    return date.getMonth() === referenceDate.getMonth();
  };

  const isSelectedDate = (date: Date, referenceDate: Date) => {
    return (
      date.getDate() === referenceDate.getDate() &&
      date.getMonth() === referenceDate.getMonth() &&
      date.getFullYear() === referenceDate.getFullYear()
    );
  };

  const handleStartDateSelect = (date: Date) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    setShowStartCalendar(false);
  };

  const handleEndDateSelect = (date: Date) => {
    setFormData((prev) => ({ ...prev, endDate: date }));
    setShowEndCalendar(false);
  };

  const handlePreviousMonth = (type: "start" | "end") => {
    if (type === "start") {
      setFormData((prev) => ({
        ...prev,
        startDate: new Date(
          prev.startDate.getFullYear(),
          prev.startDate.getMonth() - 1,
          1
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        endDate: new Date(
          prev.endDate.getFullYear(),
          prev.endDate.getMonth() - 1,
          1
        ),
      }));
    }
  };

  const handleNextMonth = (type: "start" | "end") => {
    if (type === "start") {
      setFormData((prev) => ({
        ...prev,
        startDate: new Date(
          prev.startDate.getFullYear(),
          prev.startDate.getMonth() + 1,
          1
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        endDate: new Date(
          prev.endDate.getFullYear(),
          prev.endDate.getMonth() + 1,
          1
        ),
      }));
    }
  };

  const formatSelectedDate = (date: Date) => {
    return format(date, "MMM d, yyyy", { locale: es });
  };

  const toggleDayOfWeek = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSave = () => {
    // Validation
    if (
      !formData.startTime ||
      !formData.endTime ||
      !formData.staffId ||
      formData.daysOfWeek.length === 0
    ) {
      return;
    }

    const newSection: Section = {
      id: initialData?.id || Date.now().toString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      repeat: formData.repeat,
      staffId: formData.staffId,
      daysOfWeek: formData.daysOfWeek,
    };

    onSave(newSection);
    onClose();
  };

  // Close calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        startCalendarRef.current &&
        !startCalendarRef.current.contains(event.target as Node)
      ) {
        setShowStartCalendar(false);
      }
      if (
        endCalendarRef.current &&
        !endCalendarRef.current.contains(event.target as Node)
      ) {
        setShowEndCalendar(false);
      }
    };

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStartCalendar, showEndCalendar]);

  const renderCalendar = (
    type: "start" | "end",
    days: Date[],
    referenceDate: Date,
    onDateSelect: (date: Date) => void,
    calendarRef: React.RefObject<HTMLDivElement | null>
  ) => {
    const monthName = format(referenceDate, "MMMM", { locale: es });
    const year = referenceDate.getFullYear();

    return (
      <div
        ref={calendarRef}
        className="absolute z-50 mt-1 bg-background border rounded-md shadow-lg p-3 w-80"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handlePreviousMonth(type)}
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
            onClick={() => handleNextMonth(type)}
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
            const isCurrentMonthDay = isCurrentMonth(day, referenceDate);
            const isSelected = isSelectedDate(day, referenceDate);

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
                onClick={() => onDateSelect(day)}
                disabled={!isCurrentMonthDay}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Añadir sesión</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Configura los horarios y días para esta sesión de {serviceName}
          </p>

          {/* Staff Selection */}
          <div className="space-y-2">
            <Label>Instructor *</Label>
            <Select
              value={formData.staffId}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, staffId: value }))
              }
              disabled={isLoadingStaff}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingStaff
                      ? "Cargando instructores..."
                      : staffError
                      ? "Error cargando instructores"
                      : staff.length === 0
                      ? "No hay instructores disponibles"
                      : "Seleccionar instructor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {staff.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{instructor.name}</span>
                      {instructor.email && (
                        <span className="text-sm text-muted-foreground">
                          {instructor.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {staffError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <span>Error: {staffError}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={fetchStaff}
                >
                  Reintentar
                </Button>
              </div>
            )}
            {!isLoadingStaff && !staffError && staff.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No se encontraron instructores. Asegúrate de que hay personal
                registrado en la base de datos.
              </p>
            )}
          </div>

          {/* Date Range Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 relative">
              <Label>Fecha de Inicio *</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                  onClick={() => setShowStartCalendar(!showStartCalendar)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatSelectedDate(formData.startDate)}
                </Button>

                {showStartCalendar &&
                  renderCalendar(
                    "start",
                    startDays,
                    formData.startDate,
                    handleStartDateSelect,
                    startCalendarRef
                  )}
              </div>
            </div>

            <div className="space-y-2 relative">
              <Label>Fecha de Fin *</Label>
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                  onClick={() => setShowEndCalendar(!showEndCalendar)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formatSelectedDate(formData.endDate)}
                </Button>

                {showEndCalendar &&
                  renderCalendar(
                    "end",
                    endDays,
                    formData.endDate,
                    handleEndDateSelect,
                    endCalendarRef
                  )}
              </div>
            </div>
          </div>

          {/* Time Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hora de Inicio *</Label>
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

            <div className="space-y-2">
              <Label>Hora de Fin *</Label>
              <TimePicker
                value={formData.endTime}
                onChange={(time) =>
                  setFormData((prev) => ({ ...prev, endTime: time }))
                }
                minHour={13}
                maxHour={16}
                interval={15}
              />
            </div>
          </div>

          {/* Days of Week Selection */}
          <div className="space-y-2">
            <Label>Días de la Semana *</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <Button
                  key={day.key}
                  type="button"
                  variant={
                    formData.daysOfWeek.includes(day.key)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-12 flex flex-col items-center justify-center text-xs"
                  onClick={() => toggleDayOfWeek(day.key)}
                >
                  <span className="font-medium">{day.label}</span>
                  <span className="text-xs opacity-75">
                    {day.fullLabel.slice(0, 3)}
                  </span>
                </Button>
              ))}
            </div>
            {formData.daysOfWeek.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Seleccionados:{" "}
                {formData.daysOfWeek
                  .map(
                    (day) => DAYS_OF_WEEK.find((d) => d.key === day)?.fullLabel
                  )
                  .join(", ")}
              </p>
            )}
          </div>

          {/* Repeat */}
          <RepeatSelect
            value={formData.repeat}
            onChange={(repeat) => setFormData((prev) => ({ ...prev, repeat }))}
            label="Repetir"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                !formData.startTime ||
                !formData.endTime ||
                !formData.staffId ||
                formData.daysOfWeek.length === 0
              }
            >
              {initialData ? "Actualizar Sesión" : "Guardar Sesión"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
