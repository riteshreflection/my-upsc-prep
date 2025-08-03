"use client";
import React, { useEffect, useState, Suspense } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "@/firebase";
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Disclosure } from '@headlessui/react';
import { FiChevronDown } from 'react-icons/fi';

function shuffle(array: any[]) {
  return array.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
}

const STATUS = {
  NOT_VISITED: "not_visited",
  NOT_ANSWERED: "not_answered",
  ANSWERED: "answered",
  REVIEW: "review",
};

// Replace 'any' with specific types or unknown
// Subject and Topic types
interface Topic {
  name: string;
  completed?: boolean;
  carry?: boolean;
}
interface Subject {
  id: string;
  name: string;
  topics?: Topic[];
  [key: string]: unknown;
}

function DailyTestPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const retakeTestId = searchParams.get('retakeTestId');

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Record<string, unknown>[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [status, setStatus] = useState<string[]>([]); // status for each question
  const [review, setReview] = useState<boolean[]>([]); // mark for review
  const [submitted, setSubmitted] = useState(false);
  const [timer, setTimer] = useState(0); // 10 min default
  const [timerActive, setTimerActive] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const [testId, setTestId] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const todayDateKey = format(new Date(), 'yyyy-MM-dd');

  // Auth check
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) window.location.href = "/login";
      else setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // Fetch subjects/topics
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

  // Timer logic
  useEffect(() => {
    if (!timerActive || submitted) return;
    if (timer === 0) {
      handleSubmit();
      setTimerActive(false);
      return;
    }
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timerActive, timer, submitted]);

  // Handle topic selection
  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  // Generate test
  const generateTest = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    if (retakeTestId) {
      // Logic to fetch the existing test for retake
      // Search all dates for the testId
      // For simplicity, try today first, then fallback to previous logic if not found
      const testRef = ref(db, `users/${user.uid}/tests/${todayDateKey}/${retakeTestId}`);
      onValue(testRef, (snapshot) => {
        const testData = snapshot.val();
        if (testData && testData.questions) {
          const numQs = testData.questions.length;
          setQuestions(testData.questions);
          setAnswers(Array(numQs).fill(null)); // Reset answers
          setStatus(Array(numQs).fill("NOT_VISITED")); // Reset status
          setReview(Array(numQs).fill(false)); // Reset review marks
          setCurrent(0); // Start from the first question
          setSubmitted(false); // Reset submission status
          setTimer(numQs * 60); // Reset timer
          setTimerActive(true);
          setTestId(retakeTestId);
          setTestStarted(true);
        } else {
          setError("Could not find the test to retake.");
        }
        setLoading(false);
      }, { onlyOnce: true });
    } else {
      // Existing logic to generate a new test
      try {
        const response = await fetch('/api/generate-test', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topics: selectedTopics, numQuestions }),
        });
        const result = await response.json();

        if (response.ok) {
          const numQs = result.questions.length;
          setQuestions(result.questions);
          setAnswers(Array(numQs).fill(null));
          setStatus(Array(numQs).fill("NOT_VISITED"));
          setReview(Array(numQs).fill(false));
          setCurrent(0);
          setSubmitted(false);
          setTimer(numQs * 60);
          setTimerActive(true);
          const newTestId = `test_${Date.now()}`;
          setTestId(newTestId);
          setTestStarted(true);
        } else {
          setError("Failed to generate test.");
        }
      } catch (e: any) {
        setError("An unexpected error occurred. Please try again.");
        console.error("Error generating test:", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAnswer = (option: string) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[current] = option;
    setAnswers(newAnswers);

    const newStatus = [...status];
    newStatus[current] = "ANSWERED";
    setStatus(newStatus);
  };

  // Handle navigation
  const goTo = (idx: number) => {
    setCurrent(idx);
    setStatus((prev) => prev.map((s, i) => i === idx && s === STATUS.NOT_VISITED ? STATUS.NOT_ANSWERED : s));
    if (user && testId) {
      set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}/status`), status.map((s, i) => i === idx && s === STATUS.NOT_VISITED ? STATUS.NOT_ANSWERED : s));
    }
  };

  // Mark for review
  const toggleReview = (idx: number) => {
    setReview((prev) => prev.map((r, i) => i === idx ? !r : r));
    setStatus((prev) => prev.map((s, i) => i === idx ? STATUS.REVIEW : s));
    if (user && testId) {
      set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}/review`), review.map((r, i) => i === idx ? !r : r));
      set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}/status`), status.map((s, i) => i === idx ? STATUS.REVIEW : s));
    }
  };

  // Clear response
  const clearResponse = (idx: number) => {
    setAnswers((prev) => prev.map((a, i) => i === idx ? null : a));
    setStatus((prev) => prev.map((s, i) => i === idx ? STATUS.NOT_ANSWERED : s));
    if (user && testId) {
      set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}/answers`), answers.map((a, i) => i === idx ? null : a));
      set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}/status`), status.map((s, i) => i === idx ? STATUS.NOT_ANSWERED : s));
    }
  };

  // Submit test
  const handleSubmit = async () => {
    setSubmitted(true);
    setTimerActive(false);
    
    if (user && testId) {
      const calculatedScore = questions.reduce((acc, q, i) => acc + (answers[i] === (q as Record<string, unknown>).answer ? 1 : 0), 0);
      const percentageScore = (calculatedScore / questions.length) * 100;
      
      // Calculate detailed analytics
      const analytics = calculateTestAnalytics(questions, answers);
      
      // Save comprehensive test data to Firebase
      const testData = {
        submitted: true,
        submittedAt: Date.now(),
        subject: selectedTopics.join(', '),
        topics: selectedTopics,
        questions,
        answers,
        review,
        status,
        score: percentageScore,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
        dateKey: todayDateKey,
        timeTaken: (numQuestions * 60) - timer,
        analytics: analytics,
        testType: 'daily-test',
        retakeCount: 0
      };

      // Save to user's tests
      await set(ref(db, `users/${user.uid}/tests/${todayDateKey}/${testId}`), testData);
      
      // Also save to global PYQ database for future reference
      await set(ref(db, `pyqs/${testId}`), {
        questions,
        topics: selectedTopics,
        createdAt: Date.now(),
        createdBy: user.uid,
        difficulty: 'mixed',
        source: 'ai-generated'
      });
      
      // Update user's test history
      const historyRef = ref(db, `users/${user.uid}/testHistory/${testId}`);
      await set(historyRef, {
        testId,
        date: todayDateKey,
        score: percentageScore,
        topics: selectedTopics,
        totalQuestions: questions.length,
        timeTaken: (numQuestions * 60) - timer,
        analytics: analytics
      });

      setFinalScore(percentageScore);
      setShowResult(true);
      setSubmitted(true);
    }
  };

  // Calculate detailed test analytics
  const calculateTestAnalytics = (questions: any[], answers: (string | null)[]) => {
    let correct = 0, wrong = 0, notAttempted = 0;
    const topicWiseAnalysis: { [key: string]: { correct: number, wrong: number, total: number } } = {};
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    questions.forEach((q, i) => {
      const userAnswer = answers[i];
      const correctAnswer = q.answer;
      const topic = q.topic || 'General';
      
      // Initialize topic analysis
      if (!topicWiseAnalysis[topic]) {
        topicWiseAnalysis[topic] = { correct: 0, wrong: 0, total: 0 };
      }
      topicWiseAnalysis[topic].total++;
      
      if (userAnswer === null) {
        notAttempted++;
      } else if (userAnswer === correctAnswer) {
        correct++;
        topicWiseAnalysis[topic].correct++;
      } else {
        wrong++;
        topicWiseAnalysis[topic].wrong++;
      }
    });
    
    // Identify strengths and weaknesses
    Object.entries(topicWiseAnalysis).forEach(([topic, analysis]) => {
      const accuracy = (analysis.correct / analysis.total) * 100;
      if (accuracy >= 70) {
        strengths.push(topic);
      } else if (accuracy < 50) {
        weaknesses.push(topic);
      }
    });
    
    const totalMarks = (correct * 2) - (wrong * 0.66);
    const accuracy = questions.length > 0 ? (correct / questions.length) * 100 : 0;
    
    return {
      correct,
      wrong,
      notAttempted,
      totalMarks: Math.round(totalMarks * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
      topicWiseAnalysis,
      strengths,
      weaknesses,
      suggestions: generateSuggestions(accuracy, topicWiseAnalysis, notAttempted)
    };
  };

  // Generate personalized suggestions
  const generateSuggestions = (accuracy: number, topicAnalysis: any, notAttempted: number) => {
    const suggestions: string[] = [];
    
    if (accuracy < 40) {
      suggestions.push("Focus on building fundamental concepts before attempting tests");
      suggestions.push("Spend more time on theory and basic understanding");
    } else if (accuracy < 60) {
      suggestions.push("Good foundation! Work on eliminating silly mistakes");
      suggestions.push("Practice more questions from weak topics");
    } else if (accuracy < 80) {
      suggestions.push("Excellent progress! Focus on time management");
      suggestions.push("Work on advanced level questions");
    } else {
      suggestions.push("Outstanding performance! Maintain consistency");
      suggestions.push("Focus on current affairs and recent developments");
    }
    
    if (notAttempted > 2) {
      suggestions.push("Improve time management - too many questions left unattempted");
      suggestions.push("Practice speed reading and quick elimination techniques");
    }
    
    // Topic-specific suggestions
    Object.entries(topicAnalysis).forEach(([topic, analysis]: [string, any]) => {
      if (analysis.correct / analysis.total < 0.5) {
        suggestions.push(`Strengthen your ${topic} concepts with focused study`);
      }
    });
    
    return suggestions;
  };

  // Chip color logic
  const getChipClass = (i: number) => {
    if (i === current) return "border-2 border-blue-500 bg-blue-100 text-blue-900";
    if (review[i]) return "bg-purple-200 text-purple-900";
    if (status[i] === STATUS.ANSWERED) return "bg-green-200 text-green-900";
    if (status[i] === STATUS.NOT_ANSWERED) return "bg-red-200 text-red-900";
    return "bg-gray-200 text-gray-700";
  };

  // Calculate summary counts
  const summary = questions.length > 0 ? status.reduce((acc, s, i) => {
    if (review[i]) acc.review++;
    else if (s === STATUS.ANSWERED) acc.answered++;
    else if (s === STATUS.NOT_ANSWERED) acc.notAnswered++;
    else acc.notVisited++;
    return acc;
  }, { answered: 0, notAnswered: 0, review: 0, notVisited: 0 }) : { answered: 0, notAnswered: 0, review: 0, notVisited: 0 };

  // If retakeTestId is present, automatically start fetching the test
  useEffect(() => {
    if (retakeTestId && user) {
      generateTest();
    }
  }, [retakeTestId, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
          <h1 className="text-4xl font-bold mb-4 text-center">Daily Prelims Test</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 text-center">
            Please <a href="/login" className="text-blue-600 hover:underline">log in</a> to access the daily test.
          </p>
        </div>
      </div>
    );
  }

  if (showResult) {
    // Get analytics from the submitted test data
    const analytics = calculateTestAnalytics(questions, answers);
    
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-bold gradient-text mb-4">Test Analysis Complete! 🎯</h2>
          <p className="text-gray-300">Comprehensive performance breakdown and personalized insights</p>
        </div>

        {/* Score Overview */}
        <div className="modern-card rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Performance Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{questions.length}</div>
              <div className="text-sm text-gray-300">Total</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{analytics.correct}</div>
              <div className="text-sm text-gray-300">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{analytics.wrong}</div>
              <div className="text-sm text-gray-300">Wrong</div>
            </div>
            <div className="text-center p-4 bg-gray-500/10 rounded-xl border border-gray-500/20">
              <div className="text-2xl font-bold text-gray-400">{analytics.notAttempted}</div>
              <div className="text-sm text-gray-300">Skipped</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-400">{analytics.totalMarks}</div>
              <div className="text-sm text-gray-300">Marks</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-2xl font-bold text-yellow-400">{analytics.accuracy}%</div>
              <div className="text-sm text-gray-300">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="modern-card rounded-2xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <span>💪</span> Strengths
            </h3>
            {analytics.strengths.length > 0 ? (
              <div className="space-y-2">
                {analytics.strengths.map((strength, idx) => (
                  <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <span className="text-green-300">{strength}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Keep practicing to identify your strengths!</p>
            )}
          </div>

          <div className="modern-card rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span>🎯</span> Areas to Improve
            </h3>
            {analytics.weaknesses.length > 0 ? (
              <div className="space-y-2">
                {analytics.weaknesses.map((weakness, idx) => (
                  <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <span className="text-red-300">{weakness}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Great! No major weaknesses identified.</p>
            )}
          </div>
        </div>

        {/* Topic-wise Analysis */}
        <div className="modern-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Topic-wise Performance</h3>
          <div className="grid gap-4">
            {Object.entries(analytics.topicWiseAnalysis).map(([topic, data]: [string, any]) => {
              const accuracy = (data.correct / data.total) * 100;
              return (
                <div key={topic} className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-white">{topic}</span>
                    <span className={`text-sm font-bold ${
                      accuracy >= 70 ? 'text-green-400' : 
                      accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(accuracy)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        accuracy >= 70 ? 'bg-green-500' : 
                        accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Correct: {data.correct}</span>
                    <span>Wrong: {data.wrong}</span>
                    <span>Total: {data.total}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personalized Suggestions */}
        <div className="modern-card rounded-2xl p-6">
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            <span>💡</span> Personalized Suggestions
          </h3>
          <div className="space-y-3">
            {analytics.suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-3">
                <span className="text-blue-400 mt-1">•</span>
                <span className="text-gray-200">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => router.push('/analytics')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
          >
            📊 View Full Analytics
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
          >
            🔄 Take Another Test
          </button>
          <button
            onClick={() => router.push('/tasks')}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
          >
            📚 Study Weak Topics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 flex flex-col md:flex-row gap-6">
      {/* Sidebar: Question Navigation & Timer */}
      {questions.length > 0 && (
        <aside className="w-full md:w-48 flex-shrink-0 mb-6 md:mb-0">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 flex flex-col items-center gap-4 sticky top-8 animate-fade-in">
            <div className="font-mono text-lg flex items-center gap-2">
              <span role="img" aria-label="timer">⏰</span>
              {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
            </div>
            <div className="flex flex-wrap md:flex-col gap-2 justify-center items-center">
              {questions.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors text-sm md:text-base ${getChipClass(i)}`}
                  title={
                    review[i]
                      ? "Marked for Review"
                      : status[i] === STATUS.ANSWERED
                      ? "Answered"
                      : status[i] === STATUS.NOT_ANSWERED
                      ? "Not Answered"
                      : status[i] === STATUS.NOT_VISITED
                      ? "Not Visited"
                      : "Current"
                  }
                  aria-label={`Question ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            {/* Legend */}
            <div className="mt-4 w-full">
              <div className="flex flex-wrap gap-2 justify-center text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500 inline-block"></span>Current</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-200 inline-block"></span>Answered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-200 inline-block"></span>Not Answered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-200 inline-block"></span>Review</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block"></span>Not Visited</span>
              </div>
            </div>
          </div>
        </aside>
      )}
      {/* Main Test Area */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-6 text-center md:text-left">Daily Test</h2>
        {/* Progress Bar & Summary */}
        {questions.length > 0 && (
          <div className="mb-4 animate-fade-in">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-2 bg-blue-500 transition-all duration-700"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs justify-between">
              <span>Answered: <span className="font-bold text-green-700">{summary.answered}</span></span>
              <span>Not Answered: <span className="font-bold text-red-700">{summary.notAnswered}</span></span>
              <span>Review: <span className="font-bold text-purple-700">{summary.review}</span></span>
              <span>Not Visited: <span className="font-bold text-gray-700">{summary.notVisited}</span></span>
              <span>Progress: <span className="font-bold text-blue-700">{current + 1} / {questions.length}</span></span>
            </div>
          </div>
        )}
        {/* Topic Selector */}
        {!questions.length && (
          <div className="mb-8 animate-fade-in">
            <div className="mb-2 font-semibold">Select Topics:</div>
            <div className="space-y-2">
              {subjects.map((s) => (
                <Disclosure key={s.id}>
                  {({ open }) => (
                    <div className="border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Disclosure.Button className="flex w-full justify-between items-center px-4 py-2 font-semibold text-left">
                        <span>{s.name}</span>
                        <FiChevronDown className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-4 pb-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {(s.topics || []).map((t: Topic) => (
                            <label key={t.name} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={selectedTopics.includes(t.name)}
                                onChange={() => handleTopicToggle(t.name)}
                              />
                              <span>{t.name}</span>
                            </label>
                          ))}
                        </div>
                      </Disclosure.Panel>
                    </div>
                  )}
                </Disclosure>
              ))}
            </div>
            <div className="mb-4 flex items-center gap-2 mt-4">
              <label htmlFor="numQuestions" className="font-semibold">Number of Questions:</label>
              <input
                id="numQuestions"
                type="number"
                min={1}
                max={30}
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                className="w-20 p-2 rounded border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 focus:outline-none"
              />
            </div>
            <button
              onClick={generateTest}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
              disabled={loading || selectedTopics.length === 0}
            >
              {loading ? "Generating..." : "Generate Test"}
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
          </div>
        )}
        {/* Test Interface */}
        {questions.length > 0 && (
          <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-xl p-6 animate-fade-in-up">
            {/* Main Question Area */}
            <div className="mb-4">
              <div className="font-bold mb-4 text-2xl md:text-3xl text-blue-900 dark:text-blue-200">Q{current + 1}. {String(questions[current].question)}</div>
              {questions[current].statements && Array.isArray(questions[current].statements) ? (
                <ol className="list-decimal ml-8 mb-4">
                  {(questions[current].statements as string[]).map((stmt: string, idx: number) => (
                    <li key={idx} className="mb-2 text-lg md:text-xl text-gray-900 dark:text-gray-100 font-medium">{stmt}</li>
                  ))}
                </ol>
              ) : null}
              <div className="flex flex-col gap-2">
                {(questions[current].options as string[]).map((opt: string, i: number) => (
                  <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-colors duration-150 text-base font-medium
                    ${submitted
                      ? (opt === (questions[current] as Record<string, unknown>).answer
                          ? "border-green-500 bg-green-50 text-green-900"
                          : answers[current] === opt
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-gray-200 bg-gray-50 text-gray-700")
                      : answers[current] === opt
                      ? "border-blue-500 bg-blue-100 text-blue-900"
                      : "border-gray-200 bg-gray-50 text-gray-700"}
                  `}>
                    <input
                      type="radio"
                      name={`q${current}`}
                      checked={answers[current] === opt}
                      onChange={() => handleAnswer(opt)}
                      disabled={submitted}
                      className="accent-blue-600 w-5 h-5"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Mark for Review and Clear Response */}
            <div className="flex gap-4 mb-4 flex-wrap">
              <button
                onClick={() => toggleReview(current)}
                className={`px-4 py-2 rounded-full font-semibold transition-colors duration-150 ${review[current] ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-900 hover:bg-purple-200"}`}
                disabled={submitted}
              >
                {review[current] ? "Marked for Review" : "Mark for Review"}
              </button>
              <button
                onClick={() => clearResponse(current)}
                className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
                disabled={submitted}
              >
                Clear Response
              </button>
            </div>
            {/* Navigation */}
            <div className="flex justify-between items-center mt-4 gap-2">
              <button
                onClick={() => goTo(Math.max(0, current - 1))}
                className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold shadow"
                disabled={current === 0}
              >Previous</button>
              {submitted ? (
                <button
                  onClick={() => goTo(Math.min(questions.length - 1, current + 1))}
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
                  disabled={current === questions.length - 1}
                >Next</button>
              ) : (
                <>
                  {current === questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow"
                    >Submit</button>
                  ) : (
                    <button
                      onClick={() => goTo(Math.min(questions.length - 1, current + 1))}
                      className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
                    >Next</button>
                  )}
                </>
              )}
            </div>
            {/* Explanations after submit */}
            {submitted && (
              <div className="mt-6 bg-blue-50 dark:bg-blue-900 rounded p-4 animate-fade-in">
                <div className="font-semibold mb-2">Explanation:</div>
                <div className="text-gray-800 dark:text-gray-100">{String(questions[current].explanation)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyTestPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DailyTestPageContent />
    </Suspense>
  );
} 