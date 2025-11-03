"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DailySalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchSales = async () => {
    const { data, error } = await supabase
      .from("daily_sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sales:", error);
      return;
    }
    setSales(data);
  };

  useEffect(() => {
    fetchSales();

    // Live updates
    const channel = supabase
      .channel("realtime-daily-sales")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_sales" },
        () => fetchSales()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredSales = sales.filter((s) =>
    s.item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-orange-500 mb-4">
          💸 Daily Sales
        </h1>

        <input
          type="text"
          placeholder="Search sales by item name..."
          className="w-full mb-6 p-2 rounded-lg bg-gray-900 border border-orange-600 focus:ring-2 focus:ring-orange-400 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredSales.length === 0 ? (
          <p className="text-gray-400">No sales found.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSales.map((s) => (
              <div
                key={s.id}
                className="bg-gray-900 border border-orange-600 rounded-xl p-4 shadow-md"
              >
                <img
                  src={s.photo || "/placeholder.png"}
                  alt={s.item}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
                <h2 className="text-xl font-semibold text-orange-400">
                  {s.item}
                </h2>
                <p className="text-gray-400">{s.description}</p>
                <p className="mt-2">💰 Cost: KES {s.cost}</p>
                <p>🏷️ Price: KES {s.price}</p>
                <p className="text-green-400 font-semibold">
                  📈 Profit: KES {s.profit}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  🗓️ Date:{" "}
                  {new Date(s.sales_date).toLocaleDateString("en-GB")}
                </p>
                <p className="text-xs text-gray-500 italic">
                  Sale Type: {s.sale_type}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}