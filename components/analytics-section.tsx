"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, DollarSign, Calendar, FileText } from "lucide-react"

export function AnalyticsSection() {
  const stats = [
    {
      title: "Visits",
      value: "264",
      change: "+5.8%",
      trend: "up",
      description: "0 today • 7 yesterday",
      icon: Users,
    },
    {
      title: "Sales",
      value: "$10,165",
      change: "+4",
      trend: "up",
      description: "$0.00 today • $0.00 yesterday",
      icon: DollarSign,
    },
    {
      title: "Bookings",
      value: "52",
      change: "+6.1%",
      trend: "up",
      description: "0 today • 0 yesterday",
      icon: Calendar,
    },
    {
      title: "Forms",
      value: "12",
      change: "+5.9%",
      trend: "up",
      description: "0 today • 1 yesterday",
      icon: FileText,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600">Statistics from the last 30 days</p>
        </div>
        <Button variant="outline">View Details</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <div className={`flex items-center ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {stat.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
