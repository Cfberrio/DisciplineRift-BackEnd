"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-10 h-10 text-green-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Successfully Unsubscribed
          </h1>
          <p className="text-gray-600 mb-6">
            You have been removed from our newsletter mailing list.
          </p>
        </div>

        {email && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Email address:</p>
            <p className="text-gray-900 font-medium break-all">{email}</p>
          </div>
        )}

        <div className="space-y-3 text-sm text-gray-600">
          <p>
            You will no longer receive newsletter emails from Discipline Rift.
          </p>
          <p>
            If this was a mistake, you can resubscribe at any time through our website.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <a 
            href="https://www.disciplinerift.com" 
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            Return to Discipline Rift
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>Discipline Rift &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

export default function UnsubscribeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}

