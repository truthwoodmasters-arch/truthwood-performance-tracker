"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function DisplayItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Fetch all items
  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("display_items")
      .select("*")
      .order("date_added", { ascending: false });

    if (error) console.error(error);
    else setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();

    // ♻️ Realtime listener for new inserts or updates
    const channel = supabase
      .channel("display-items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "display_items" },
        (payload) => {
          console.log("Realtime change:", payload);
          fetchItems(); // Auto refresh on any insert/update/delete
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Format date as dd/mm/yyyy
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-GB");
  };

  // Handle mark as sold
  const markAsSold = async (item: any) => {
    try {
      // 1️⃣ Update status in display_items
      const { error: updateError } = await supabase
        .from("display_items")
        .update({ status: "Sold" })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // 2️⃣ Insert into daily_sales
      const { error: insertError } = await supabase.from("daily_sales").insert([
        {
          item: item.item,
          description: item.description,
          cost: item.cost,
          price: item.price,
          photo: item.photo,
          profit: item.profit,
          sale_type: "Display Sale",
          sales_date: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setMessage(`✅ ${item.item} marked as Sold and moved to Daily Sales`);
    } catch (err: any) {
      console.error("Error updating sale:", err);
      setMessage("⚠️ Failed to mark as sold. Try again.");
    }
  };

  // Filter search
  const filteredItems = items.filter(
    (i) =>
      i.item.toLowerCase().includes(search.toLowerCase()) ||
      i.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-orange-500 mb-8 text-center">
        📦 Display Items
      </h1>

      <div className="max-w-5xl mx-auto">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-gray-400"
        />

        {/* Message */}
        {message && (
          <p
            className={`text-center mb-6 font-medium ${
              message.startsWith("✅")
                ? "text-green-400"
                : message.startsWith("⚠️")
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}

        {/* Items */}
        {loading ? (
          <p className="text-center text-gray-400">Loading items...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-center text-gray-400">No items found.</p>
        ) : (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow hover:shadow-lg hover:shadow-orange-500/10 transition"
              >
                <img
                  src={item.photo}
                  alt={item.item}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
                <h2 className="text-lg font-semibold text-orange-400">
                  {item.item}
                </h2>
                <p className="text-gray-400 text-sm mb-2">
                  {item.description || "No description"}
                </p>
                <div className="text-sm text-gray-300 mb-2">
                  <p>Cost: KES {item.cost}</p>
                  <p>Price: KES {item.price}</p>
                  <p>Profit: KES {item.profit}</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Added: {formatDate(item.date_added)}
                </p>
                <span
                  className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
                    item.status === "Sold"
                      ? "bg-green-700 text-green-200"
                      : "bg-orange-700 text-orange-200"
                  }`}
                >
                  {item.status}
                </span>

                {item.status !== "Sold" && (
                  <button
                    onClick={() => markAsSold(item)}
                    className="mt-4 w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2 rounded-lg transition"
                  >
                    Mark as Sold
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-gray-500 mt-10 text-sm">
        © {new Date().getFullYear()} Truth Wood Masters Tracker
      </footer>
    </div>
  );
}