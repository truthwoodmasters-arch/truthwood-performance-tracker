"use client"

import Link from "next/link"

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">Truth Wood Masters Tracker</h1>
      <p className="text-gray-600 mb-8 text-center">Choose an action below:</p>

      <div className="flex gap-4">
        <Link
          href="/upload-photo"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          📤 Upload Item
        </Link>
        <Link
          href="/display"
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
        >
          📦 View Items
        </Link>
      </div>
    </main>
  )
}