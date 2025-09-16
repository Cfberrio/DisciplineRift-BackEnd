"use client"

import type React from "react"

import { Filter, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ServicesFiltersProps {
  onFilterChange?: (filters: { category: string; search: string }) => void
  onManageCategories?: () => void
  categories?: string[]
}

export function ServicesFilters({ onFilterChange, onManageCategories, categories = [] }: ServicesFiltersProps) {
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    onFilterChange?.({ category: value, search })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onFilterChange?.({ category, search: e.target.value })
  }

  // Default categories if none provided
  const availableCategories = categories.length > 0 ? categories : ["volleyball", "tennis", "pickleball"]

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Select defaultValue="all" onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {availableCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onManageCategories} className="whitespace-nowrap">
          Manage Categories
        </Button>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon">
          <ListFilter className="h-4 w-4" />
        </Button>
        <div className="relative w-full sm:w-auto">
          <Input
            placeholder="Search services..."
            className="pl-8 w-full sm:w-[200px]"
            value={search}
            onChange={handleSearchChange}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-search absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>
    </div>
  )
}
