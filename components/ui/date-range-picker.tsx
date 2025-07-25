"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, isAfter, isBefore, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange: DateRange | undefined
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  label?: string
  error?: string
}

export function DatePickerWithRange({
  dateRange,
  onDateRangeChange,
  className,
  label = "Rango de fechas",
  error,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)
  const calendarRef = React.useRef<HTMLDivElement>(null)

  // Generate days for the current month and surrounding days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1)
    // Get the last day of the month
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDayOfMonth.getDay() - 1 // Adjust for Monday start
    if (firstDayOfWeek < 0) firstDayOfWeek = 6 // Sunday becomes last day

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (42 = 6 rows of 7 days)
    const totalDays = 42

    const days: Date[] = []

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push(date)
    }

    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push(date)
    }

    // Add days from next month
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push(date)
    }

    return days
  }

  const days = generateCalendarDays()

  // Get day names
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

  // Format month name
  const monthName = format(currentMonth, "LLLL yyyy", { locale: es })

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Handle date selection
  const handleDateClick = (date: Date) => {
    console.log("Date clicked:", date)

    if (!dateRange || !dateRange.from || (dateRange.from && dateRange.to)) {
      // Start a new selection
      onDateRangeChange({ from: date, to: undefined })
      console.log("Starting new selection with from:", date)
    } else {
      // Complete the selection
      if (isBefore(date, dateRange.from)) {
        // If clicked date is before the start date, swap them
        onDateRangeChange({ from: date, to: dateRange.from })
        console.log("Completing selection with swapped dates - from:", date, "to:", dateRange.from)
      } else {
        onDateRangeChange({ from: dateRange.from, to: date })
        console.log("Completing selection - from:", dateRange.from, "to:", date)
      }

      // Close the calendar after selection is complete
      setTimeout(() => setIsOpen(false), 300)
    }
  }

  // Handle date hover for preview
  const handleDateHover = (date: Date) => {
    setHoverDate(date)
  }

  // Check if a date is in the selected range
  const isInRange = (date: Date) => {
    if (!dateRange?.from) return false

    if (dateRange.to) {
      // If we have a complete range
      return (
        (isAfter(date, dateRange.from) || isSameDay(date, dateRange.from)) &&
        (isBefore(date, dateRange.to) || isSameDay(date, dateRange.to))
      )
    } else if (hoverDate && dateRange.from) {
      // If we're in the process of selecting (hovering)
      if (isBefore(hoverDate, dateRange.from)) {
        return (
          (isAfter(date, hoverDate) || isSameDay(date, hoverDate)) &&
          (isBefore(date, dateRange.from) || isSameDay(date, dateRange.from))
        )
      } else {
        return (
          (isAfter(date, dateRange.from) || isSameDay(date, dateRange.from)) &&
          (isBefore(date, hoverDate) || isSameDay(date, hoverDate))
        )
      }
    }

    return false
  }

  // Check if a date is the start of the range
  const isRangeStart = (date: Date) => {
    return dateRange?.from && isSameDay(date, dateRange.from)
  }

  // Check if a date is the end of the range
  const isRangeEnd = (date: Date) => {
    return dateRange?.to && isSameDay(date, dateRange.to)
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // Format the date range for display
  const formatDateRange = () => {
    if (!dateRange?.from) {
      return "Seleccionar fechas"
    }

    if (!dateRange.to) {
      return format(dateRange.from, "PPP", { locale: es })
    }

    return `${format(dateRange.from, "PPP", { locale: es })} - ${format(dateRange.to, "PPP", { locale: es })}`
  }

  // Handle quick selection buttons
  const selectThisWeek = () => {
    const today = new Date()
    onDateRangeChange({
      from: today,
      to: addDays(today, 6),
    })
    setTimeout(() => setIsOpen(false), 300)
  }

  const selectNextTwoWeeks = () => {
    const today = new Date()
    onDateRangeChange({
      from: today,
      to: addDays(today, 13),
    })
    setTimeout(() => setIsOpen(false), 300)
  }

  const selectThisMonth = () => {
    const today = new Date()
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    onDateRangeChange({
      from: today,
      to: lastDay,
    })
    setTimeout(() => setIsOpen(false), 300)
  }

  // Close the calendar when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={cn("space-y-2 relative", className)}>
      {label && <Label htmlFor="date-range">{label}</Label>}

      <Button
        id="date-range"
        type="button"
        variant={error ? "destructive" : "outline"}
        className={cn(
          "w-full justify-start text-left font-normal",
          !dateRange && "text-muted-foreground",
          error && "border-red-500",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <div ref={calendarRef} className="absolute z-50 mt-1 bg-background border rounded-md shadow-md p-3 w-[332px]">
          <div className="space-y-4">
            {/* Calendar header with instructions */}
            <div className="text-center space-y-2 pb-2 border-b">
              <h3 className="text-sm font-medium">Seleccione un rango de fechas</h3>
              <p className="text-xs text-muted-foreground">
                {!dateRange?.from
                  ? "Haga clic para seleccionar la fecha de inicio"
                  : !dateRange.to
                    ? "Ahora haga clic para seleccionar la fecha de fin"
                    : "Rango seleccionado. Haga clic para cambiar."}
              </p>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToPreviousMonth}>
                <span className="sr-only">Mes anterior</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>

              <h3 className="text-sm font-medium capitalize">{monthName}</h3>

              <Button variant="outline" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                <span className="sr-only">Mes siguiente</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Button>
            </div>

            {/* Calendar grid */}
            <div>
              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-xs text-center font-medium text-muted-foreground h-8 flex items-center justify-center"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1" onMouseLeave={() => setHoverDate(null)}>
                {days.map((day, index) => {
                  const isStart = isRangeStart(day)
                  const isEnd = isRangeEnd(day)
                  const inRange = isInRange(day)
                  const isCurrentMonthDay = isCurrentMonth(day)

                  return (
                    <button
                      key={index}
                      type="button"
                      className={cn(
                        "h-8 w-8 text-xs rounded-md flex items-center justify-center relative",
                        isCurrentMonthDay ? "text-foreground" : "text-muted-foreground opacity-50",
                        isToday(day) && "border border-primary",
                        (isStart || isEnd) && "bg-primary text-primary-foreground font-semibold",
                        inRange && !isStart && !isEnd && "bg-primary/10",
                        !isCurrentMonthDay && "hover:bg-transparent",
                        isCurrentMonthDay && !inRange && !isStart && !isEnd && "hover:bg-muted",
                      )}
                      onClick={() => handleDateClick(day)}
                      onMouseEnter={() => handleDateHover(day)}
                      disabled={!isCurrentMonthDay}
                    >
                      {day.getDate()}

                      {/* Visual indicators for range start/end */}
                      {isStart && inRange && !isEnd && <div className="absolute right-0 w-1/2 h-full bg-primary/10" />}
                      {isEnd && inRange && !isStart && <div className="absolute left-0 w-1/2 h-full bg-primary/10" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick selection buttons */}
            <div className="pt-2 border-t flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectThisWeek}>
                Esta semana
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectNextTwoWeeks}>
                Próximas 2 semanas
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={selectThisMonth}>
                Este mes
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
