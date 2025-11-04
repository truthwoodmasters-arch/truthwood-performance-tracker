"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";

type SaleRow = {
  id?: number;
  sales_date: string;
  item: string;
  price: number;
  cost: number;
  profit: number;
  sale_type?: string;
};

export default function BusinessAnalysis() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(currentYear);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // fetch from daily_sales
  const fetchSales = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
  .from("daily_sales")
  .select("*");

      if (error) throw error;
      setSales(data || []);
      setLastUpdatedAt(new Date());
    } catch (err) {
      console.error("Error fetching business analysis data:", err);
    } finally {
      setLoading(false);
    }
  };

  // realtime subscription
  useEffect(() => {
    fetchSales();

    const channel = supabase
      .channel("business-analysis-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_sales" },
        (payload) => {
          console.log("Realtime daily_sales change:", payload);
          fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // filter sales by selected year
  const yearSales = useMemo(
    () => sales.filter((s) => new Date(s.sales_date).getFullYear() === year),
    [sales, year]
  );

  // monthly aggregates for the selected year
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthlyData = useMemo(() => {
    return months.map((m, i) => {
      const items = yearSales.filter(
        (r) => new Date(r.sales_date).getMonth() === i
      );
      const revenue = items.reduce((a, b) => a + Number(b.price || 0), 0);
      const profit = items.reduce((a, b) => a + Number(b.profit || 0), 0);
      return { month: m, revenue, profit, count: items.length };
    });
  }, [yearSales]);

  // current and previous month data
  const currentMonthIndex = new Date().getMonth();
  const currentMonthData = monthlyData[currentMonthIndex] || {
    month: months[currentMonthIndex],
    revenue: 0,
    profit: 0,
    count: 0,
  };
  const prevMonthData =
    monthlyData[(currentMonthIndex + 11) % 12] || { revenue: 0, profit: 0, count: 0 };

  const percentChange = (now: number, prev: number) => {
    if (prev === 0 && now === 0) return 0;
    if (prev === 0) return 100;
    return ((now - prev) / Math.abs(prev)) * 100;
  };

  const revenueChange = percentChange(currentMonthData.revenue, prevMonthData.revenue);
  const profitChange = percentChange(currentMonthData.profit, prevMonthData.profit);
  const margin =
    currentMonthData.revenue === 0
      ? 0
      : (currentMonthData.profit / currentMonthData.revenue) * 100;

  // top items
  const topItems = useMemo(() => {
    const map: Record<
      string,
      { count: number; profit: number; revenue: number }
    > = {};
    yearSales.forEach((r) => {
      const k = r.item || "Unknown";
      if (!map[k]) map[k] = { count: 0, profit: 0, revenue: 0 };
      map[k].count += 1;
      map[k].profit += Number(r.profit || 0);
      map[k].revenue += Number(r.price || 0);
    });
    const byCount = Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([item, v]) => ({ item, ...v }));
    const byProfit = Object.entries(map)
      .sort((a, b) => b[1].profit - a[1].profit)
      .slice(0, 5)
      .map(([item, v]) => ({ item, ...v }));
    return { byCount, byProfit };
  }, [yearSales]);

  // available years
  const availableYears = useMemo(() => {
    const ys = new Set<number>(sales.map((s) => new Date(s.sales_date).getFullYear()));
    const arr = Array.from(ys).sort((a,b)=>b-a);
    if (!arr.includes(currentYear)) arr.unshift(currentYear);
    return arr.slice(0, 10);
  }, [sales, currentYear]);

  // helper for currency
  const formatKES = (n: number) =>
    `KES ${Math.round(n).toLocaleString("en-KE")}`;

  return (
    <main className="min-h-screen bg-black text-gray-100 p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-orange-400">📈 Business Analysis</h1>
            <p className="text-sm text-gray-400 mt-1">
              Professional analytics • {year} • Private view
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <select
              className="bg-zinc-900 border border-zinc-700 text-white px-3 py-2 rounded-lg"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* summary cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6"
        >
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-sm text-gray-400">This Month ({currentMonthData.month}) Revenue</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-lg font-semibold text-white">{formatKES(currentMonthData.revenue)}</div>
                <div className="text-xs text-gray-400">Revenue</div>
              </div>
              <div className={`flex items-center text-sm font-semibold ${revenueChange>=0 ? "text-green-400" : "text-red-400"}`}>
                {revenueChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="ml-1">{Math.abs(revenueChange).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-sm text-gray-400">This Month Profit</p>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="text-lg font-semibold text-white">{formatKES(currentMonthData.profit)}</div>
                <div className="text-xs text-gray-400">Profit</div>
              </div>
              <div className={`flex items-center text-sm font-semibold ${profitChange>=0 ? "text-green-400" : "text-red-400"}`}>
                {profitChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                <span className="ml-1">{Math.abs(profitChange).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-sm text-gray-400">Profit Margin</p>
            <div className="mt-2">
              <div className="text-lg font-semibold text-orange-400">{margin.toFixed(1)}%</div>
              <div className="text-xs text-gray-400">Profit / Revenue</div>
            </div>
          </div>

          {/* ✅ Changed: Sales Count (Monthly) */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl">
            <p className="text-sm text-gray-400">Sales Count (Monthly)</p>
            <div className="mt-2">
              <div className="text-lg font-semibold text-white">{currentMonthData.count}</div>
              <div className="text-xs text-gray-400">
                Total sales recorded this month
              </div>
            </div>
          </div>
        </motion.div>

        {/* charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* line chart */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <h3 className="text-sm text-orange-400 font-semibold mb-3">Monthly Revenue & Profit</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyData}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip formatter={(value: any) => formatKES(Number(value))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-end text-xs text-gray-500 mt-2">Updated: {lastUpdatedAt ? lastUpdatedAt.toLocaleString() : "—"}</div>
          </div>

          {/* top selling (bar) */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <h3 className="text-sm text-orange-400 font-semibold mb-3">Top 5 Selling Items</h3>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={topItems.byCount}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="item" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* most profitable list + small bar chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <h3 className="text-sm text-orange-400 font-semibold mb-3">Top 5 Most Profitable Items</h3>
            <ul>
              {topItems.byProfit.map((p) => (
                <li key={p.item} className="flex items-center justify-between py-2 border-b border-zinc-800">
                  <div>
                    <div className="font-medium">{p.item}</div>
                    <div className="text-xs text-gray-400">
                      Sales: {p.count} • Revenue: {formatKES(p.revenue)}
                    </div>
                  </div>
                  <div className="text-sm text-green-400">{formatKES(p.profit)}</div>
                </li>
              ))}
              {topItems.byProfit.length === 0 && <li className="text-gray-400">No data</li>}
            </ul>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
            <h3 className="text-sm text-orange-400 font-semibold mb-3">Profit Distribution (Top Items)</h3>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={topItems.byProfit}>
                  <CartesianGrid stroke="#222" strokeDasharray="3 3" />
                  <XAxis dataKey="item" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip formatter={(v: any) => formatKES(Number(v))} />
                  <Bar dataKey="profit" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-sm text-gray-500">
          © {new Date().getFullYear()} Truth Wood Masters — Business Analysis (private)
        </footer>
      </div>
    </main>
  );
}