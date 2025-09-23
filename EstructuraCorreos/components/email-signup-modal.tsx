"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Mail, ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailSignupModalProps {
  onSubscribe: (email: string, sportInterest?: string) => Promise<void>
  isSubmitting: boolean
}

export default function EmailSignupModal({ onSubscribe, isSubmitting }: EmailSignupModalProps) {
  const [email, setEmail] = useState("")
  const [sportInterest, setSportInterest] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) {
      setError("Email address is required.")
      return
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    await onSubscribe(email, sportInterest)
  }

  return (
    <DialogContent className="w-[95vw] max-w-md sm:w-full md:max-w-lg lg:max-w-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none shadow-2xl rounded-lg overflow-hidden max-h-[90vh] overflow-y-auto">
      <DialogHeader className="pt-6 sm:pt-8 px-6 sm:px-8 text-center">
        <div className="mx-auto mb-4 bg-yellow-400 p-3 rounded-full w-fit">
          <Mail className="h-8 w-8 text-blue-700" />
        </div>
        <DialogTitle className="font-ethnocentric text-xl sm:text-2xl md:text-3xl lg:text-4xl text-yellow-300 tracking-wide mb-2 leading-tight">
          What If Sports Could Unlock Your Child's Potential?
        </DialogTitle>
        <DialogDescription className="text-blue-100 text-sm sm:text-base leading-relaxed mb-2">
          Discover how volleyball, tennis, or pickleball can help your child build confidence, discipline, and teamwork—all while having fun.
          <br /><strong>Sign up to get season updates, expert tips, and priority registration.</strong>
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-4 sm:py-6 space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error) setError("")
            }}
            required
            className={cn(
              "w-full pl-10 pr-4 py-3 h-12 text-base rounded-md border-2 bg-blue-600/50 text-white placeholder-blue-300 focus:bg-blue-600 focus:border-yellow-400 focus:ring-yellow-400",
              error && "border-red-400 focus:border-red-500 ring-red-500",
            )}
            aria-describedby="email-error"
          />
        </div>
        
        {/* Sport Interest Dropdown */}
        <div className="space-y-2">
          <Select value={sportInterest} onValueChange={setSportInterest}>
            <SelectTrigger className="w-full h-12 text-base rounded-md border-2 bg-blue-600/50 text-white border-blue-400 focus:border-yellow-400 focus:ring-yellow-400">
              <SelectValue placeholder="Child's sport interest" className="text-blue-300" />
            </SelectTrigger>
            <SelectContent className="bg-blue-600 border-blue-400">
              <SelectItem value="volleyball" className="text-white hover:bg-blue-500">Volleyball</SelectItem>
              <SelectItem value="pickleball" className="text-white hover:bg-blue-500">Pickleball</SelectItem>
              <SelectItem value="tennis" className="text-white hover:bg-blue-500">Tennis</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p id="email-error" className="text-sm text-red-300 bg-red-900/50 px-3 py-2 rounded-md">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-700 font-bold rounded-md h-12 text-lg transition-all duration-300 transform hover:scale-105 shadow-md"
        >
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
          {isSubmitting ? "GETTING GUIDE..." : "Get My Parent Guide"}
        </Button>
      </form>
      <DialogFooter className="px-6 sm:px-8 pb-6 sm:pb-8 text-center space-y-3">
        <div className="w-full">
          <p className="text-sm font-semibold text-yellow-300 mb-1">
            How to Stay Connected to Your Child's Sports Journey
          </p>
          <p className="text-xs text-blue-200">
            5 simple ways to spark excitement and build a love for sports at home.
          </p>
        </div>
        
      </DialogFooter>
      {/* DialogClose is automatically added by shadcn/ui Dialog for the 'X' button */}
    </DialogContent>
  )
}
