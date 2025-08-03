"use client";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';

interface TestData {
  testId: string;
  date: string;
  dateKey: string;
  score: number;
  topics: string[];
  totalQuestions: number;
  timeTaken: number;
  analytics?: {
    correct: number;
    wrong: number;
    notAttempted: number;
    accuracy: number;
    totalMarks: number;
    topicWiseAnalysis?: { [key: string]: { correct: number; wrong: number; total: number } };
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
  };
  questions?: any[];
  answers?: any[];
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [testHistory, setTestHistory] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const router = useRouter();

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

  // Fetch test history
  useEffect(() => {
    if (!user) return;
    
    const historyRef = ref(db, `users/${user.uid}/testHistory`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const tests = Object.values(data) as TestData[];
      setTestHistory(tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate overall statistics
  const calculateOverallStats = () => {
    if (testHistory.length === 0) return null;

    const totalTests = testHistory.length;
    const totalQuestions = testHistory.reduce((sum, test) => sum + (test.totalQuestions || 0), 0);
    const totalCorrect = testHistory.reduce((sum, test) => sum + (test.analytics?.correct || 0), 0);
    const totalWrong = testHistory.reduce((sum, test) => sum + (test.analytics?.wrong || 0), 0);
    const averageScore = testHistory.reduce((sum, test) => sum + (test.score || 0), 0) / totalTests;
    const averageAccuracy = testHistory.reduce((sum, test) => sum + (test.analytics?.accuracy || 0), 0) / totalTests;
    
    // Topic-wise performance
    const topicStats: { [key: string]: { correct: number; wrong: number; total: number } } = {};
    testHistory.forEach(test => {
      if (test.analytics?.topicWiseAnalysis) {
        Object.entries(test.analytics.topicWiseAnalysis).forEach(([topic, stats]) => {
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, wrong: 0, total: 0 };
          }
          topicStats[topic].correct += stats.correct;
          topicStats[topic].wrong += stats.wrong;
          topicStats[topic].total += stats.total;
        });
      }
    });

    // Performance trend (last 10 tests)
    const recentTests = testHistory.slice(0, 10).reverse();
    const trend = recentTests.map(test => ({
      date: test.dateKey || test.date,
      score: test.score || 0,
      accuracy: test.analytics?.accuracy || 0
    }));

    return {
      totalTests,
      totalQuestions,
      totalCorrect,
      totalWrong,
      averageScore: Math.round(averageScore * 100) / 100,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      topicStats,
      trend
    };
  };

  const retakeTest = async (testId: string) => {
    router.push(`/daily-test?retakeTestId=${testId}`);
  };

  const viewTestDetails = (test: TestData) => {
    setSelectedTest(test);
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const overallStats = calculateOverallStats();

  if (selectedTest) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedTest(null)}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          ← Back to Analytics
        </button>

        {/* Test Details */}
        <div className="modern-card rounded-2xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Test Analysis - {format(new Date(selectedTest.date), 'MMM dd, yyyy')}
            </h1>
                                  <p className="text-gray-300">Topics: {selectedTest.topics && Array.isArray(selectedTest.topics) ? selectedTest.topics.join(', ') : 'N/A'}</p>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <div className="text-2xl font-bold text-blue-400">{selectedTest.score || 0}%</div>
              <div className="text-sm text-gray-300">Score</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="text-2xl font-bold text-green-400">{selectedTest.analytics?.correct || 0}</div>
              <div className="text-sm text-gray-300">Correct</div>
            </div>
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="text-2xl font-bold text-red-400">{selectedTest.analytics?.wrong || 0}</div>
              <div className="text-sm text-gray-300">Wrong</div>
            </div>
            <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <div className="text-2xl font-bold text-purple-400">{selectedTest.analytics?.totalMarks || 0}</div>
              <div className="text-sm text-gray-300">Marks</div>
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">💪 Strengths</h3>
              {selectedTest.analytics?.strengths && Array.isArray(selectedTest.analytics.strengths) && selectedTest.analytics.strengths.length > 0 ? (
                <div className="space-y-2">
                  {selectedTest.analytics.strengths.map((strength, idx) => (
                    <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <span className="text-green-300 text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No specific strengths identified</p>
              )}
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <h3 className="text-lg font-bold text-red-400 mb-3">🎯 Areas to Improve</h3>
              {selectedTest.analytics?.weaknesses && Array.isArray(selectedTest.analytics.weaknesses) && selectedTest.analytics.weaknesses.length > 0 ? (
                <div className="space-y-2">
                  {selectedTest.analytics.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <span className="text-red-300 text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No major weaknesses identified</p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Personalized Suggestions</h3>
            <div className="space-y-2">
              {selectedTest.analytics?.suggestions && Array.isArray(selectedTest.analytics.suggestions) && selectedTest.analytics.suggestions.length > 0 ? (
                selectedTest.analytics.suggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-200 text-sm">{suggestion}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No suggestions available</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => retakeTest(selectedTest.testId)}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
            >
              🔄 Retake Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">📊 Analytics Dashboard</h1>
        <p className="text-xl text-gray-300">Comprehensive performance insights and test history</p>
      </div>

      {overallStats ? (
        <>
          {/* Overall Statistics */}
          <div className="modern-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Overall Performance</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="text-2xl font-bold text-blue-400">{overallStats.totalTests}</div>
                <div className="text-sm text-gray-300">Tests Taken</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <div className="text-2xl font-bold text-purple-400">{overallStats.totalQuestions}</div>
                <div className="text-sm text-gray-300">Questions</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{overallStats.totalCorrect}</div>
                <div className="text-sm text-gray-300">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <div className="text-2xl font-bold text-red-400">{overallStats.totalWrong}</div>
                <div className="text-sm text-gray-300">Wrong</div>
              </div>
              <div className="text-center p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <div className="text-2xl font-bold text-yellow-400">{overallStats.averageScore}%</div>
                <div className="text-sm text-gray-300">Avg Score</div>
              </div>
              <div className="text-center p-4 bg-teal-500/10 rounded-xl border border-teal-500/20">
                <div className="text-2xl font-bold text-teal-400">{overallStats.averageAccuracy}%</div>
                <div className="text-sm text-gray-300">Avg Accuracy</div>
              </div>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="modern-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Performance Trend</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {overallStats.trend && Array.isArray(overallStats.trend) && overallStats.trend.map((point, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500 hover:from-blue-400 hover:to-purple-400"
                    style={{ height: `${Math.max((point.score / 100) * 200, 10)}px` }}
                    title={`${point.score}% on ${point.date}`}
                  ></div>
                  <div className="text-xs text-gray-400 mt-2 transform -rotate-45 origin-left">
                    {point.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Topic-wise Performance */}
          <div className="modern-card rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Topic-wise Performance</h2>
            <div className="grid gap-4">
              {overallStats.topicStats && Object.entries(overallStats.topicStats).map(([topic, stats]) => {
                const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
                return (
                  <div key={topic} className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{topic}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {stats.correct}/{stats.total} questions
                        </span>
                        <span className={`text-sm font-bold ${
                          accuracy >= 70 ? 'text-green-400' : 
                          accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {Math.round(accuracy)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          accuracy >= 70 ? 'bg-green-500' : 
                          accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${accuracy}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test History */}
          <div className="modern-card rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Test History</h2>
              <div className="flex gap-4">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-600"
                  aria-label="Select time period"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {testHistory && Array.isArray(testHistory) && testHistory.map((test) => (
                <div key={test.testId} className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        Test on {format(new Date(test.date), 'MMM dd, yyyy')}
                      </h3>
                      <p className="text-sm text-gray-400">
                        Topics: {test.topics && Array.isArray(test.topics) ? test.topics.join(', ') : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        (test.score || 0) >= 70 ? 'text-green-400' : 
                        (test.score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {test.score || 0}%
                      </div>
                      <div className="text-sm text-gray-400">
                        {test.analytics?.correct || 0}/{test.totalQuestions || 0} correct
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Accuracy</div>
                      <div className="font-semibold text-white">{test.analytics?.accuracy || 0}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Time Taken</div>
                      <div className="font-semibold text-white">{Math.floor((test.timeTaken || 0) / 60)}m {(test.timeTaken || 0) % 60}s</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Marks</div>
                      <div className="font-semibold text-white">{test.analytics?.totalMarks || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-400">Skipped</div>
                      <div className="font-semibold text-white">{test.analytics?.notAttempted || 0}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {test.analytics?.strengths && Array.isArray(test.analytics.strengths) && test.analytics.strengths.length > 0 && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          💪 {test.analytics.strengths.length} strengths
                        </span>
                      )}
                      {test.analytics?.weaknesses && Array.isArray(test.analytics.weaknesses) && test.analytics.weaknesses.length > 0 && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                          🎯 {test.analytics.weaknesses.length} areas to improve
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewTestDetails(test)}
                        className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        📊 View Details
                      </button>
                      <button
                        onClick={() => retakeTest(test.testId)}
                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        🔄 Retake Test
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="modern-card rounded-2xl p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-white mb-4">No Test Data Yet</h2>
          <p className="text-gray-300 mb-6">
            Take your first test to see detailed analytics and performance insights.
          </p>
          <button
            onClick={() => router.push('/daily-test')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105"
          >
            📝 Take Your First Test
          </button>
        </div>
      )}
    </div>
  );
}
