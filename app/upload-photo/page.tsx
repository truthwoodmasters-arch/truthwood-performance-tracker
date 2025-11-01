"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function UploadItemPage() {
  const [item, setItem] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function handleUpload() {
    setMessage("");

    if (!item || !photoFile) {
      setMessage("⚠️ Please fill all required fields.");
      return;
    }

    try {
      const fileName = `${Date.now()}_${photoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("item-photos")
        .upload(fileName, photoFile);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setMessage("❌ Upload failed.");
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("item-photos")
        .getPublicUrl(fileName);

      const photoUrl = publicUrlData.publicUrl;
      const profit = Number(price) - Number(cost);

      const { error: insertError } = await supabase.from("display_items").insert([
        {
          item,
          description,
          cost,
          price,
          status,
          photo: photoUrl,
          date_added: new Date().toISOString(),
          profit,
        },
      ]);

      if (insertError) {
        console.error("DB save failed:", insertError);
        setMessage("⚠️ Upload succeeded but saving item failed.");
      } else {
        setMessage("✅ Item uploaded successfully!");
        setItem("");
        setDescription("");
        setCost("");
        setPrice("");
        setStatus("");
        setPhotoFile(null);
      }
    } catch (err) {
      console.error("Error:", err);
      setMessage("❌ Unexpected error occurred.");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">📤 Upload Item Photo</h1>

      <div className="flex flex-col gap-3 w-full max-w-md bg-white p-6 rounded-xl shadow-md">
        <input
          type="text"
          placeholder="Item Name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="border rounded-md p-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border rounded-md p-2"
        />
        <input
          type="number"
          placeholder="Cost"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          className="border rounded-md p-2"
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded-md p-2"
        />
        <input
          type="text"
          placeholder="Status (e.g. In Stock)"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-md p-2"
        />
        <input
          type="file"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="border rounded-md p-2"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Upload Photo
        </button>

        {message && <p className="mt-2 text-center">{message}</p>}
      </div>
    </main>
  );
}