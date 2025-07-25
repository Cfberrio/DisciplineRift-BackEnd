"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface RepeatSelectProps {
  value?: string
  onChange: (repeat: string) => void
  label?: string
  error?: string
  disabled?: boolean
}

const repeatOptions = [
  { value: "none", label: "Doesn't Repeat" },
  { value: "weekly", label: "Weekly" },
  { value: "every-2-weeks", label: "Every 2 weeks" },
  { value: "every-3-weeks", label: "Every 3 weeks" },
  { value: "every-4-weeks", label: "Every 4 weeks" },
]

export function RepeatSelect({ value = "none", onChange, label, error, disabled }: RepeatSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedRepeat, setSelectedRepeat] = React.useState(value)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const selectedOption = repeatOptions.find((option) => option.value === selectedRepeat)

  const handleRepeatSelect = (repeatValue: string) => {
    setSelectedRepeat(repeatValue)
    onChange(repeatValue)
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
          {selectedOption?.label}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-background border rounded-md shadow-md">
            {repeatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                  selectedRepeat === option.value && "bg-primary text-primary-foreground",
                )}
                onClick={() => handleRepeatSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
