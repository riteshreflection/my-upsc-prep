"use client";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue, push, set, remove } from "firebase/database";
import { db } from "@/firebase";

// Define FlashCard and Topic types
interface FlashCard {
  id: string;
  question: string;
  answer: string;
  topic: string;
  [key: string]: unknown;
}
interface Topic {
  name: string;
  [key: string]: unknown;
}

export default function FlashCardsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [flashCards, setFlashCards] = useState<FlashCard[]>([]);
  const [tab, setTab] = useState<"generate" | "view">("generate");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState("");
  const [flipped, setFlipped] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [genTopic, setGenTopic] = useState("");
  const [genNum, setGenNum] = useState(5);
  const [genLoading, setGenLoading] = useState(false);
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [topics, setTopics] = useState<Topic[]>([]);

  // Auth check
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) window.location.href = "/login";
      else setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Fetch flash cards
  useEffect(() => {
    if (!user) return;
    const cardsRef = ref(db, `users/${user.uid}/flashCards`);
    const unsub = onValue(cardsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loaded: FlashCard[] = Object.entries(data).map(([id, value]: [string, any]) => ({ id, ...value }));
      setFlashCards(loaded);
    });
    return () => unsub();
  }, [user]);

  // Add new card
  const handleAddCard = async () => {
    if (!user || !question.trim() || !answer.trim() || !topic.trim()) return;
    setLoading(true);
    const cardsRef = ref(db, `users/${user.uid}/flashCards`);
    const newCardRef = push(cardsRef);
    await set(newCardRef, { question, answer, topic, createdAt: Date.now() });
    setQuestion("");
    setAnswer("");
    setTopic("");
    setLoading(false);
  };

  // Delete card
  const handleDeleteCard = async (id: string) => {
    if (!user) return;
    await remove(ref(db, `users/${user.uid}/flashCards/${id}`));
  };

  // Generate flash cards with Gemini
  const handleGenerateCards = async () => {
    if (!user || !genTopic.trim() || genNum < 1) return;
    setGenLoading(true);
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: genTopic, numCards: genNum }),
      });
      const data = await res.json();
      if (data.cards && Array.isArray(data.cards)) {
        const cardsRef = ref(db, `users/${user.uid}/flashCards`);
        for (const card of data.cards) {
          const newCardRef = push(cardsRef);
          await set(newCardRef, { question: card.question, answer: card.answer, topic: genTopic, createdAt: Date.now() });
        }
        setGenTopic("");
        setGenNum(5);
      } else {
        alert("Failed to generate cards.");
      }
    } catch {
      alert("Failed to generate cards.");
    }
    setGenLoading(false);
  };

  // Get unique topics for filtering
  useEffect(() => {
    const uniqueTopics = Array.from(new Set(flashCards.map(card => card.topic).filter(Boolean)));
    setTopics(uniqueTopics.map(name => ({ name })));
  }, [flashCards]);

  const filteredCards = filterTopic ? flashCards.filter(card => card.topic === filterTopic) : flashCards;
  // Group cards by topic
  const cardsByTopic: Record<string, FlashCard[]> = {};
  filteredCards.forEach(card => {
    if (!cardsByTopic[card.topic]) cardsByTopic[card.topic] = [];
    cardsByTopic[card.topic].push(card);
  });

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <h2 className="text-3xl font-bold mb-6 text-center">Flash Cards</h2>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 justify-center">
        <button
          onClick={() => setTab("generate")}
          className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${tab === "generate" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
        >Generate</button>
        <button
          onClick={() => setTab("view")}
          className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${tab === "view" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
        >My Flash Cards</button>
      </div>
      {/* Generate Tab */}
      {tab === "generate" && (
        <div className="mb-8 bg-white dark:bg-gray-950 rounded-xl shadow p-6 animate-fade-in">
          <div className="mb-4 font-semibold text-lg">Generate Flash Cards with Gemini</div>
          <input
            type="text"
            placeholder="Enter topic (e.g., Indian Polity)"
            className="w-full mb-2 p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
            value={genTopic}
            onChange={e => setGenTopic(e.target.value)}
          />
          <div className="flex items-center gap-2 mb-2">
            <label htmlFor="genNum" className="font-semibold">Number of Cards:</label>
            <input
              id="genNum"
              type="number"
              min={1}
              max={20}
              value={genNum}
              onChange={e => setGenNum(Number(e.target.value))}
              className="w-20 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
            />
          </div>
          <button
            onClick={handleGenerateCards}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
            disabled={genLoading || !genTopic.trim() || genNum < 1}
          >
            {genLoading ? "Generating..." : "Generate Flash Cards"}
          </button>
          <div className="mt-8 border-t pt-6">
            <div className="mb-4 font-semibold text-lg">Add Custom Flash Card</div>
            <input
              type="text"
              placeholder="Question"
              className="w-full mb-2 p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
            <textarea
              placeholder="Answer / Explanation"
              className="w-full mb-2 p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              rows={3}
            />
            <input
              type="text"
              placeholder="Topic / Category"
              className="w-full mb-2 p-3 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
            <button
              onClick={handleAddCard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
              disabled={loading || !question.trim() || !answer.trim() || !topic.trim()}
            >
              {loading ? "Adding..." : "Add Card"}
            </button>
          </div>
        </div>
      )}
      {/* View Tab */}
      {tab === "view" && (
        <div className="animate-fade-in">
          <div className="mb-6 flex flex-wrap gap-2 items-center">
            <span className="font-semibold">Filter by Topic:</span>
            <button
              onClick={() => setFilterTopic("")}
              className={`px-3 py-1 rounded-full font-semibold ${!filterTopic ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
            >All</button>
            {topics.map((topic: Topic) => (
              <button
                key={topic.name}
                onClick={() => setFilterTopic(topic.name)}
                className={`px-3 py-1 rounded-full font-semibold ${filterTopic === topic.name ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
              >{topic.name}</button>
            ))}
          </div>
          {Object.keys(cardsByTopic).length === 0 && (
            <div className="text-center text-gray-500">No flash cards found.</div>
          )}
          {Object.entries(cardsByTopic).map(([topicName, topicCards]) => (
            <div key={topicName} className="mb-10">
              <div className="mb-2 text-xl font-bold text-blue-700 dark:text-blue-200">{topicName}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {topicCards.map((card: FlashCard) => {
                  const isFlipped = flipped === card.id;
                  return (
                    <div key={card.id} className="perspective-1000 w-full">
                      <div
                        className={`relative w-full h-80 rounded-xl shadow-lg cursor-pointer transition-transform duration-500 ${isFlipped ? "rotate-y-180 shadow-2xl z-30" : "z-10"}`}
                        style={{ minHeight: 320, minWidth: 320, maxWidth: 420, height: 320, width: 360, transformStyle: "preserve-3d", transition: 'all 0.4s cubic-bezier(.4,2,.6,1)' }}
                        onClick={() => setFlipped(isFlipped ? null : card.id)}
                        tabIndex={0}
                        aria-label="Flip card"
                      >
                        {/* Front */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden bg-white dark:bg-gray-950 rounded-xl p-8 z-10 overflow-y-auto">
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteCard(card.id); }}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-700 text-lg z-20"
                            title="Delete Card"
                          >✕</button>
                          <div className="text-xl font-bold mb-4 text-center text-blue-700 dark:text-blue-200">Question</div>
                          <div className="text-center text-lg md:text-xl text-gray-900 dark:text-gray-100 min-h-[80px] flex items-center justify-center whitespace-pre-line break-words">{card.question}</div>
                          <div className="mt-4 text-xs text-gray-400">Click to flip</div>
                        </div>
                        {/* Back */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center backface-hidden bg-white dark:bg-gray-950 rounded-xl p-8 rotate-y-180 z-20 overflow-y-auto">
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteCard(card.id); }}
                            className="absolute top-2 right-2 text-red-400 hover:text-red-700 text-lg z-30"
                            title="Delete Card"
                          >✕</button>
                          <div className="text-xl font-bold mb-4 text-center text-green-700 dark:text-green-300">Answer</div>
                          <div className="text-center text-lg md:text-xl text-green-700 dark:text-green-300 min-h-[80px] flex items-center justify-center whitespace-pre-line break-words">{card.answer}</div>
                          <div className="mt-4 text-xs text-gray-400">Click to flip</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Add to global CSS:
// .perspective-1000 { perspective: 1000px; }
// .backface-hidden { backface-visibility: hidden; }
// .rotate-y-180 { transform: rotateY(180deg); } 