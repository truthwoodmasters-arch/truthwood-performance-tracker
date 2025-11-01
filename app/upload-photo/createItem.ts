"use server"

import { supabase } from "@/lib/supabaseClient"

// This function inserts uploaded image info into your display_items table
export async function createDisplayItem(item: {
  name: string
  description: string
  photoUrl: string
  cost?: number
  price?: number
}) {
  const { data, error } = await supabase
    .from("display_items")
    .insert([
      {
        item: item.name,
        description: item.description,
        photo: item.photoUrl,
        cost: item.cost ?? 0,
        price: item.price ?? 0,
        status: "available"
      }
    ])

  if (error) {
    console.error("Error inserting item:", error)
    throw error
  }

  return data
}