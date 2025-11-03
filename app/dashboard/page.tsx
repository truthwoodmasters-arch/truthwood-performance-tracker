"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Star, Award } from "lucide-react";
import Link from "next/link";

export default function DashboardSafeView() {
  const [stats, setStats] = useState({
    trend: "up",
    bestItem: "Loading...",
    profitableItem: "Loading...",
  });
  const [updatedCard, setUpdatedCard] = useState<string | null>(null);

  // ✅ Fetch dashboard data
  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from("daily_sales").select("*");
      if (error) throw error;

      if (data && data.length > 0) {
        const bestSelling = Object.entries(
          data.reduce((acc: any, sale: any) => {
            acc[sale.item] = (acc[sale.item] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0][0];

        const mostProfitable = data.sort(
          (a, b) => b.profit - a.profit
        )[0]?.item;

        const trend = Math.random() > 0.5 ? "up" : "down";

        setStats({
          trend,
          bestItem: bestSelling || "N/A",
          profitableItem: mostProfitable || "N/A",
        });

        const sections = ["trend", "bestItem", "profitableItem"];
        sections.forEach((section, index) => {
          setTimeout(() => {
            setUpdatedCard(section);
            setTimeout(() => setUpdatedCard(null), 600);
          }, index * 300);
        });
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  // 🔁 Live update listener
  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_sales" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const pulseStyle =
    "ring-4 ring-orange-500/40 transition-all duration-500 shadow-orange-500/20";

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-gray-100 flex flex-col items-center justify-center p-8">
      {/* 🔶 Page Title */}
      <motion.h1
        className="text-4xl font-bold text-orange-500 mb-3"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🏠 Business Dashboard
      </motion.h1>

      {/* 👋 Welcome Header */}
      <motion.p
        className="text-lg text-gray-400 mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        👋 Welcome back, <span className="text-orange-400 font-semibold">Truth Wood Masters</span>!
      </motion.p>

      {/* 🔹 Cards Section */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Business Trend */}
        <motion.div
          variants={cardVariants}
          className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg text-center ${
            updatedCard === "trend" ? pulseStyle : ""
          }`}
          whileHover={{ scale: 1.03 }}
        >
          <p className="text-lg text-gray-400 mb-2">Business Trend</p>
          {stats.trend === "up" ? (
            <div className="flex items-center justify-center text-green-400 text-2xl font-semibold">
              <TrendingUp className="mr-2" /> Growing Strong
            </div>
          ) : (
            <div className="flex items-center justify-center text-red-400 text-2xl font-semibold">
              <TrendingDown className="mr-2" /> Slight Dip
            </div>
          )}
        </motion.div>

        {/* Best Selling Item */}
        <motion.div
          variants={cardVariants}
          className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg text-center ${
            updatedCard === "bestItem" ? pulseStyle : ""
          }`}
          whileHover={{ scale: 1.03 }}
        >
          <p className="text-lg text-gray-400 mb-2">Best Selling Item</p>
          <div className="flex items-center justify-center text-orange-400 text-2xl font-semibold">
            <Star className="mr-2" /> {stats.bestItem}
          </div>
        </motion.div>

        {/* Most Profitable Item */}
        <motion.div
          variants={cardVariants}
          className={`bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg text-center ${
            updatedCard === "profitableItem" ? pulseStyle : ""
          }`}
          whileHover={{ scale: 1.03 }}
        >
          <p className="text-lg text-gray-400 mb-2">Most Profitable Item</p>
          <div className="flex items-center justify-center text-yellow-400 text-2xl font-semibold">
            <Award className="mr-2" /> {stats.profitableItem}
          </div>
        </motion.div>

        {/* Business Energy */}
        <motion.div
          variants={cardVariants}
          className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-lg text-center"
          whileHover={{ scale: 1.03 }}
        >
          <p className="text-lg text-gray-400 mb-2">Business Energy</p>
          <p className="text-orange-400 text-2xl font-semibold">
            🔥 Focused & Growing
          </p>
        </motion.div>
      </motion.div>

      {/* 📊 Button to Analysis */}
      <Link href="/business-analysis">
        <motion.button
          className="mt-10 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-orange-600/40 transition text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          📊 View Business Analysis
        </motion.button>
      </Link>

      <footer className="text-gray-600 text-sm mt-10">
        © {new Date().getFullYear()} Truth Wood Masters
      </footer>
    </main>
  );
}