'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Users, Send } from 'lucide-react'

export default function EmailMarketingPage() {
  const router = useRouter()
  const [subscriberCount, setSubscriberCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriberCount()
  }, [])

  const fetchSubscriberCount = async () => {
    try {
      const response = await fetch('/api/email-marketing/subscribers')
      const data = await response.json()
      
      if (data.success) {
        setSubscriberCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching subscriber count:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Marketing</h1>
        <p className="text-muted-foreground">
          Send newsletters to your subscribers
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Subscribers
            </CardTitle>
            <CardDescription>Active newsletter subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-3xl font-bold text-muted-foreground">Loading...</div>
            ) : (
              <div className="text-4xl font-bold">{subscriberCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Newsletter Campaign
            </CardTitle>
            <CardDescription>Create and send email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/email-marketing/compose')}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Compose Newsletter
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Compose Your Newsletter</h3>
                <p className="text-sm text-muted-foreground">
                  Create your email content with a custom subject, message, and sender information.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Preview and Test</h3>
                <p className="text-sm text-muted-foreground">
                  Preview how your email will look and send test emails to verify formatting.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Send to All Subscribers</h3>
                <p className="text-sm text-muted-foreground">
                  Send your newsletter to all subscribers with automatic batch processing and delivery tracking.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

