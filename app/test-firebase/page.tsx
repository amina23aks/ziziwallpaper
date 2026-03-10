"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export default function TestFirebasePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAddTestDoc = async () => {
    try {
      setLoading(true);
      setMessage("");

      const docRef = await addDoc(collection(db, "test_connection"), {
        text: "Firebase is connected",
        createdAt: serverTimestamp(),
      });

      setMessage(`Success! Document created: ${docRef.id}`);
    } catch (error) {
      console.error(error);
      setMessage("Failed to write to Firestore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-4 text-2xl font-bold">Test Firebase</h1>

      <button
        onClick={handleAddTestDoc}
        disabled={loading}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Saving..." : "Add Test Document"}
      </button>

      {message ? <p className="mt-4">{message}</p> : null}
    </main>
  );
}