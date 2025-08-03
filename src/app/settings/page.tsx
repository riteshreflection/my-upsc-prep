"use client";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/firebase";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [motivation, setMotivation] = useState("");

  // Auth check
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) window.location.href = "/login";
      else setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    const profileRef = ref(db, `users/${user.uid}/profile`);
    const unsub = onValue(profileRef, (snapshot) => {
      const data = snapshot.val() || {};
      setName(data.name || "");
      setExamDate(data.examDate || "");
      setMotivation(data.motivation || "");
    });
    return () => unsub();
  }, [user]);

  // Save profile
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await set(ref(db, `users/${user.uid}/profile`), { name, examDate, motivation });
    setLoading(false);
    setSuccess("Settings updated!");
    setTimeout(() => setSuccess(""), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-2">
      <h2 className="text-3xl font-bold mb-6 text-center">Settings</h2>
      <div className="bg-white dark:bg-gray-950 rounded-xl shadow p-6 animate-fade-in flex flex-col gap-6">
        <div>
          <label className="block font-semibold mb-1">User Name</label>
          <input
            type="text"
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Exam Date</label>
          <input
            type="date"
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Motivation Trigger</label>
          <input
            type="text"
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
            placeholder="E.g. 'Remember your goal!' or 'Do it for your family!'"
          />
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
        {success && <div className="text-green-600 text-center font-semibold">{success}</div>}
      </div>
    </div>
  );
} 