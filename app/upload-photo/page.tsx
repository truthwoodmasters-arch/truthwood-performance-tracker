"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UploadPhotoPage() {
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("In Stock");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Upload and save item
  const handleUpload = async () => {
    if (!item || !description || !cost || !price || !photoFile) {
      setMessage("⚠️ Please fill in all fields and select a photo.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // 1️⃣ Upload photo to Supabase Storage
      const fileName = `${Date.now()}_${photoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/item-photos/${fileName}`;

      // 2️⃣ Insert into display_items
      const profit = parseFloat(price) - parseFloat(cost);
      const { error: insertError } = await supabase.from("display_items").insert([
        {
          item,
          description,
          cost: parseFloat(cost),
          price: parseFloat(price),
          status,
          photo: photoUrl,
          profit,
          date_added: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setMessage("✅ Upload and save successful!");
      setItem("");
      setDescription("");
      setCost("");
      setPrice("");
      setStatus("In Stock");
      setPhotoFile(null);
    } catch (err: any) {
      console.error("DB save failed:", err);
      setMessage("⚠️ Upload succeeded but saving item failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 p-6">
      <h1 className="text-3xl font-bold text-orange-500 mb-8 text-center">
        📤 Upload Item Photo
      </h1>

      <div className="max-w-xl mx-auto bg-zinc-900 p-6 rounded-2xl shadow border border-zinc-800">
        <div className="space-y-5">
          <input
            type="text"
            placeholder="Item name"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-gray-400"
          ></textarea>

          <input
            type="number"
            placeholder="Cost (KES)"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          <input
            type="number"
            placeholder="Price (KES)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
          >
            <option>In Stock</option>
            <option>Sold</option>
          </select>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4
                         file:rounded-lg file:border-0 file:text-sm file:font-semibold
                         file:bg-orange-500 file:text-white hover:file:bg-orange-600"
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-lg transition"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </div>

        {message && (
          <p
            className={`mt-6 text-center font-medium ${
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
      </div>

      <footer className="text-center text-gray-500 mt-10 text-sm">
        © {new Date().getFullYear()} Truth Wood Masters Tracker
      </footer>
    </div>
  );
}