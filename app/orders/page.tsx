"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  // ✅ Fetch all orders
  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching orders:", error);
    else setOrders(data || []);
  };

  // ✅ Move delivered orders to daily_sales
  const moveToDailySales = async (order) => {
    const { data: inserted, error: insertError } = await supabase
      .from("daily_sales")
      .insert([
        {
          item: order.item,
          description: order.description,
          cost: order.cost,
          price: order.price,
          photo: order.photo,
          sale_type: "order",
          profit: order.price - order.cost,
        },
      ]);

    if (insertError) {
      console.error("Failed to move to daily_sales:", insertError);
    } else {
      console.log("✅ Order moved to daily_sales:", inserted);
    }
  };

  // ✅ Update status (Pending → Delivered)
  const handleStatusChange = async (id, currentStatus, order) => {
    const newStatus = currentStatus === "Pending" ? "Delivered" : "Pending";
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) console.error("Failed to update status:", error);
    else {
      if (newStatus === "Delivered") await moveToDailySales(order);
    }
  };

  // ✅ Listen for live changes
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Realtime update:", payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ✅ Styling
  const bg = "bg-gray-900 text-orange-400";
  const card = "bg-gray-800 text-white rounded-xl p-4 shadow-md hover:shadow-lg transition";

  return (
    <main className={`min-h-screen ${bg} p-6`}>
      <h1 className="text-3xl font-bold text-center mb-6">🧾 Orders</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-400">No orders found.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div key={order.id} className={card}>
              <img
                src={order.photo || "/no-image.png"}
                alt={order.item}
                className="rounded-lg w-full h-48 object-cover mb-3"
              />
              <h2 className="text-xl font-semibold text-orange-400">{order.item}</h2>
              <p className="text-sm text-gray-400 mb-2">{order.description}</p>
              <p>💰 Cost: {order.cost}</p>
              <p>🏷️ Price: {order.price}</p>
              <p>📈 Profit: {order.profit}</p>
              <p>📅 {new Date(order.created_at).toLocaleDateString()}</p>

              <button
                onClick={() =>
                  handleStatusChange(order.id, order.status, order)
                }
                className={`mt-3 w-full py-2 rounded-md ${
                  order.status === "Pending"
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {order.status === "Pending" ? "Mark as Delivered" : "Delivered ✅"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}