"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface DisplayItem {
  id: number;
  item: string;
  description: string;
  date_added: string;
  cost: number;
  price: number;
  status: string;
  photo: string;
  profit: number;
}

export default function DisplayItemsPage() {
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from("display_items")
        .select("*")
        .order("date_added", { ascending: false });

      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    }

    fetchItems();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">📦 Display Items</h1>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p>No items found. Try uploading one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center"
            >
              <img
                src={item.photo}
                alt={item.item}
                className="w-48 h-48 object-cover rounded-md mb-3"
              />
              <h2 className="text-lg font-semibold">{item.item}</h2>
              <p className="text-gray-600 text-sm mb-2">{item.description}</p>
              <p className="text-sm">💰 Cost: {item.cost}</p>
              <p className="text-sm">🏷️ Price: {item.price}</p>
              <p className="text-sm text-green-700 font-semibold">
                Profit: {item.profit}
              </p>
              <p className="text-sm text-blue-600">{item.status}</p>
              <p className="text-xs text-gray-400">
                Added: {new Date(item.date_added).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}