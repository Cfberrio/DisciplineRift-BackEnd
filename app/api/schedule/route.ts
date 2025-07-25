import { NextResponse } from "next/server"
import type { ScheduleData } from "@/lib/api/types"

// Sample schedule data
const scheduleData: ScheduleData = {
  events: [
    {
      id: "1",
      title: "VOLLEYBALL PINECREST",
      date: "2025-04-29",
      time: "3:00 PM",
      participants: 19,
      maxParticipants: 20,
    },
    {
      id: "2",
      title: "ADVANCED TENNIS PINECREST",
      date: "2025-04-29",
      time: "3:15 PM",
      participants: 5,
      maxParticipants: 20,
    },
    {
      id: "3",
      title: "VOLLEYBALL INDEPENDENCE",
      date: "2025-04-29",
      time: "3:15 PM",
      participants: 21,
      maxParticipants: 20,
    },
  ],
  dates: ["2025-04-29", "2025-04-30", "2025-05-01"],
}

export async function GET() {
  // Simulate a delay to show loading state
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json(scheduleData)
}
