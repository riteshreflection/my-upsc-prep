"use client";
import React, { useEffect, useState } from "react";
import { ref, onValue, set, push, remove, update } from "firebase/database";
import { db } from "@/firebase";
import { FaCheckCircle, FaTrash, FaPlus, FaClock, FaBook } from "react-icons/fa";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";

interface Topic {
  name: string;
  completed?: boolean;
}
interface Subject {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  start: string;
  end: string;
  topics?: Topic[];
  [key: string]: unknown;
}

const getTimeString = (time: string) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${ampm}`;
};

export default function TasksPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newTopic, setNewTopic] = useState<{ [subjectId: string]: string }>({});
  const [user, setUser] = useState<User | null>(null);
  const [examDate, setExamDate] = useState("");
  const router = useRouter();
  const [aiTopics, setAiTopics] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [editTopics, setEditTopics] = useState<string[]>([]);

  // Auth check and fetch subjects
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/login");
      } else {
        setUser(firebaseUser);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch subjects from Firebase for the current user
  useEffect(() => {
    if (!user) return;
    const subjectsRef = ref(db, `users/${user.uid}/subjects`);
    const unsub = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loadedSubjects = Object.entries(data).map(([id, value]) => ({ id, ...(value as Record<string, unknown>) })) as Subject[];
      setSubjects(loadedSubjects);
    });
    return () => unsub();
  }, [user]);

  // Fetch exam date
  useEffect(() => {
    if (!user) return;
    const examRef = ref(db, `users/${user.uid}/examDate`);
    const unsubExam = onValue(examRef, (snapshot) => {
      setExamDate(snapshot.val() || "");
    });
    return () => unsubExam();
  }, [user]);

  // Add new subject
  const handleAddSubject = async () => {
    if (!user || !subjectName.trim() || !startTime || !endTime || !startDate || !endDate) return;
    const subjectsRef = ref(db, `users/${user.uid}/subjects`);
    const newSubjectRef = push(subjectsRef);
    await set(newSubjectRef, { name: subjectName, start: startTime, end: endTime, startDate, endDate, topics: [] });
    setSubjectName("");
    setStartTime("");
    setEndTime("");
    setStartDate("");
    setEndDate("");
    setShowModal(false);
  };

  // Delete subject
  const handleDeleteSubject = async (subjectId: string) => {
    if (!user) return;
    const subjectRef = ref(db, `users/${user.uid}/subjects/${subjectId}`);
    await remove(subjectRef);
  };

  // Add topic to subject
  const handleAddTopic = async (subjectId: string) => {
    if (!user) return;
    const topic = newTopic[subjectId]?.trim();
    if (!topic) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const updatedTopics = [...(subject.topics || []), { name: topic, completed: false }];
    const subjectRef = ref(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    await set(subjectRef, updatedTopics);
    setNewTopic((prev) => ({ ...prev, [subjectId]: "" }));
  };

  // Toggle topic completion
  const handleToggleTopic = async (subjectId: string, idx: number) => {
    if (!user) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const updatedTopics = (subject.topics || []).map((t: Topic, i: number) =>
      i === idx ? { ...t, completed: !t.completed } : t
    );
    const subjectRef = ref(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    await set(subjectRef, updatedTopics);
  };

  // Delete topic
  const handleDeleteTopic = async (subjectId: string, idx: number) => {
    if (!user) return;
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    const updatedTopics = (subject.topics || []).filter((_, i) => i !== idx);
    const subjectRef = ref(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    await set(subjectRef, updatedTopics);
  };

  const handleSetExamDate = async () => {
    if (!user || !examDate) return;
    const examRef = ref(db, `users/${user.uid}/examDate`);
    await set(examRef, examDate);
  };

  // Generate topics with Gemini
  const handleGenerateTopics = async (subjectId: string, subjectName: string) => {
    setAiLoading(true);
    setEditSubjectId(subjectId);
    setEditTopics([]);
    try {
      const res = await fetch("/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: subjectName }),
      });
      const data = await res.json();
      if (data.topics && Array.isArray(data.topics)) {
        setAiTopics(data.topics);
        setEditTopics(data.topics);
      } else {
        setAiTopics([]);
        setEditTopics([]);
        alert("Failed to generate topics.");
      }
    } catch {
      setAiTopics([]);
      setEditTopics([]);
      alert("Failed to generate topics.");
    }
    setAiLoading(false);
  };
  // Save edited topics
  const handleSaveTopics = async (subjectId: string) => {
    if (!user) return;
    const subjectRef = ref(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    await set(subjectRef, editTopics.map(t => ({ name: t, completed: false })));
    setEditSubjectId(null);
    setEditTopics([]);
    setAiTopics([]);
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2">
      <div className="mb-6 flex flex-col md:flex-row items-center gap-2 justify-center">
        <label htmlFor="exam-date" className="font-semibold">मुख्य परीक्षा तिथि:</label>
        <input
          id="exam-date"
          type="date"
          className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
          value={examDate}
          onChange={e => setExamDate(e.target.value)}
        />
        <button
          onClick={handleSetExamDate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          सहेजें
        </button>
      </div>
      {/* Add Subject */}
      <div className="flex flex-col md:flex-row gap-2 mb-8 items-center justify-center">
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2 font-semibold transition-all"
        >
          <FaPlus /> Add Subject
        </button>
      </div>
      {/* Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {subjects.map((subject, idx) => (
          <div
            key={subject.id}
            className={`relative rounded-2xl shadow-xl p-6 bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 border-t-4 ${["border-blue-400","border-purple-400","border-pink-400","border-green-400"][idx%4]}`}
          >
            <button
              onClick={() => handleDeleteSubject(subject.id)}
              className="absolute top-4 right-4 text-red-400 hover:text-red-600"
              title="Delete Subject"
            >
              <FaTrash />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <FaBook className="text-2xl text-blue-500" />
              <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{subject.name}</div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-gray-600 dark:text-gray-300">
              <FaClock />
              <span className="font-medium">{getTimeString(subject.start)} - {getTimeString(subject.end)}</span>
            </div>
            {/* Topics */}
            <div className="bg-white dark:bg-gray-950 rounded-lg p-4 shadow-inner">
              <div className="flex gap-2 mb-3">
                <label htmlFor={`new-topic-${subject.id}`} className="sr-only">Add New Topic</label>
                <input
                  id={`new-topic-${subject.id}`}
                  type="text"
                  className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                  placeholder="Add topic (e.g., Fundamental Rights)"
                  value={newTopic[subject.id] || ""}
                  onChange={e => setNewTopic(prev => ({ ...prev, [subject.id]: e.target.value }))}
                />
                <button
                  onClick={() => handleAddTopic(subject.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  title="Add Topic"
                >
                  <FaPlus />
                </button>
              </div>
              <ul className="space-y-2">
                {(subject.topics || []).map((topic: Topic, index: number) => (
                  <li key={topic.name} className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleTopic(subject.id, index)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${topic.completed ? "bg-green-500 border-green-600" : "bg-white border-gray-400"}`}
                      aria-label={topic.name}
                      title={topic.completed ? "Mark as incomplete" : "Mark as complete"}
                    >
                      {topic.completed && <FaCheckCircle className="text-white text-base" />}
                    </button>
                    <span className={topic.completed ? "line-through text-gray-400" : ""}>{topic.name}</span>
                    <button
                      onClick={() => handleDeleteTopic(subject.id, index)}
                      className="text-red-400 hover:text-red-700 ml-2"
                      title="Delete Topic"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleGenerateTopics(subject.id, subject.name)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold flex-1"
                disabled={aiLoading && editSubjectId === subject.id}
              >
                {aiLoading && editSubjectId === subject.id ? "Generating..." : "AI Generate Topics"}
              </button>
              <button
                onClick={() => { setEditSubjectId(subject.id); setEditTopics(subject.topics?.map((t: Topic) => t.name) || []); setAiTopics([]); }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex-1"
              >Edit Topics</button>
            </div>
            {/* Editable topics list if editing this subject */}
            {editSubjectId === subject.id && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded p-4">
                <div className="font-semibold mb-2">Edit Topics</div>
                <ul className="mb-2 flex flex-col gap-2">
                  {editTopics.map((topic, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <input
                        placeholder="Add topic (e.g., Fundamental Rights)"
                        type="text"
                        value={topic}
                        onChange={e => setEditTopics(editTopics.map((t, i) => i === idx ? e.target.value : t))}
                        className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                      />
                      <button
                        onClick={() => setEditTopics(editTopics.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 px-2"
                        title="Remove"
                      >✕</button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setEditTopics([...editTopics, ""])}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-semibold mb-2"
                >+ Add Topic</button>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSaveTopics(subject.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold shadow"
                  >Save Topics</button>
                  <button
                    onClick={() => { setEditSubjectId(null); setEditTopics([]); setAiTopics([]); }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-full font-semibold"
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* Modal for adding subject */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
            <h3 className="text-2xl font-bold mb-4 text-center">Add Subject</h3>
            <div className="flex flex-col gap-4">
              <label htmlFor="subject-name" className="font-semibold">Subject Name</label>
              <input
                id="subject-name"
                type="text"
                className="p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                placeholder="Subject Name (e.g., Polity)"
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
              />
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col">
                  <label htmlFor="start-time" className="text-xs mb-1 text-gray-500">Start Time</label>
                  <input
                    id="start-time"
                    type="time"
                    className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="end-time" className="text-xs mb-1 text-gray-500">End Time</label>
                  <input
                    id="end-time"
                    type="time"
                    className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex flex-col">
                  <label htmlFor="start-date" className="text-xs mb-1 text-gray-500">Start Date</label>
                  <input
                    id="start-date"
                    type="date"
                    className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label htmlFor="end-date" className="text-xs mb-1 text-gray-500">End Date</label>
                  <input
                    id="end-date"
                    type="date"
                    className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddSubject}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold flex-1"
                >
                  Add Subject
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 