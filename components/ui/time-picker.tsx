"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  label?: string
  error?: string
  disabled?: boolean
}

export function TimePicker({ value, onChange, label, error, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedTime, setSelectedTime] = React.useState(value || "11:30 AM")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Generate time options
  const timeOptions = React.useMemo(() => {
    const times: string[] = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date()
        time.setHours(hour, minute, 0, 0)
        const timeString = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        times.push(timeString)
      }
    }
    return times
  }, [])

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    onChange(time)
    setIsOpen(false)
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="space-y-2 relative">
      {label && <Label>{label}</Label>}

      <div ref={dropdownRef} className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal",
            error && "border-red-500",
            disabled && "opacity-50 cursor-not-allowed",
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          {selectedTime}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
            {timeOptions.map((time) => (
              <button
                key={time}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                  selectedTime === time && "bg-primary text-primary-foreground",
                )}
                onClick={() => handleTimeSelect(time)}
              >
                {time}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
