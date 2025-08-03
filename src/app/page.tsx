"use client";
import React, { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FiHome, FiClipboard, FiAward, FiSettings, FiBarChart2, FiCalendar, FiClock, FiTarget, FiTrendingUp } from "react-icons/fi";

// Daily quotes in Hindi
const dailyQuotes = [
  {
    quote: "सफलता का रहस्य यह है कि आप जो कर रहे हैं उसे पूरी तरह से करें।",
    author: "स्वामी विवेकानंद"
  },
  {
    quote: "जीवन में सबसे बड़ी गलती डर के कारण प्रयास न करना है।",
    author: "महात्मा गांधी"
  },
  {
    quote: "शिक्षा सबसे शक्तिशाली हथियार है जिसका उपयोग आप दुनिया को बदलने के लिए कर सकते हैं।",
    author: "नेल्सन मंडेला"
  },
  {
    quote: "अपने सपनों को पूरा करने के लिए आपको अपनी आराम क्षेत्र से बाहर निकलना होगा।",
    author: "डॉ. ए.पी.जे. अब्दुल कलाम"
  },
  {
    quote: "हारने का डर जीतने की इच्छा से कहीं ज्यादा शक्तिशाली है।",
    author: "रॉबर्ट कियोसाकी"
  },
  {
    quote: "सफलता कोई दुर्घटना नहीं है, यह कड़ी मेहनत, दृढ़ता, सीखने, बलिदान और सबसे बढ़कर, जो आप कर रहे हैं उससे प्यार करने का परिणाम है।",
    author: "पेले"
  },
  {
    quote: "जीवन में सबसे महत्वपूर्ण बात यह है कि आप क्या सीखते हैं और कैसे बढ़ते हैं।",
    author: "माया एंजेलो"
  },
  {
    quote: "आपका भविष्य आपके आज के फैसलों पर निर्भर करता है।",
    author: "अब्राहम लिंकन"
  }
];

function daysBetween(date1: string, date2: string) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function todayISO() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function usePomodoro(initial = 25 * 60) {
  const [seconds, setSeconds] = useState(initial);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isActive && seconds > 0) {
      timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    } else if (isActive && seconds === 0) {
      setIsActive(false);
      setIsBreak((b) => !b);
      setSeconds(isBreak ? 25 * 60 : 5 * 60);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, seconds, isBreak]);

  return {
    seconds,
    isActive,
    isBreak,
    minutes: Math.floor(seconds / 60),
    remSeconds: seconds % 60,
  };
}

// Enhanced streak calculation with proper logic
function calculateStreak(subjects: any[], user: User | null) {
  if (!subjects.length || !user) return 0;
  
  const today = todayISO();
  let streak = 0;
  let currentDate = new Date(today);
  
  // Check backwards from today
  while (true) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    let hasStudiedToday = false;
    
    // Check if user studied any subject on this date
    for (const subject of subjects) {
      if (subject.topics && subject.topics.length > 0) {
        const completedTopics = subject.topics.filter((topic: any) => 
          topic.completed && topic.completedDate === dateStr
        );
        if (completedTopics.length > 0) {
          hasStudiedToday = true;
          break;
        }
      }
    }
    
    if (hasStudiedToday) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If it's today and no study done, streak is 0
      if (dateStr === today) {
        streak = 0;
      }
      break;
    }
    
    // Prevent infinite loop
    if (streak > 365) break;
  }
  
  return streak;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const router = useRouter();
  const [profile, setProfile] = useState<{ name?: string; examDate?: string; motivation?: string }>({});
  const [istTime, setIstTime] = useState<string>("");
  const [breakTimer, setBreakTimer] = useState(300);
  const [breakActive, setBreakActive] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  
  // Get today's quote based on date
  const currentDate = new Date();
  const quoteIndex = currentDate.getDate() % dailyQuotes.length;
  const todaysQuote = dailyQuotes[quoteIndex];

  // Auth check
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

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    const profileRef = ref(db, `users/${user.uid}/profile`);
    const unsub = onValue(profileRef, (snapshot) => {
      setProfile(snapshot.val() || {});
    });
    return () => unsub();
  }, [user]);

  // Fetch subjects and calculate streak
  useEffect(() => {
    if (!user) return;
    const subjectsRef = ref(db, `users/${user.uid}/subjects`);
    const unsubSubjects = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loadedSubjects = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
      setSubjects(loadedSubjects);
      
      // Calculate and update streak
      const calculatedStreak = calculateStreak(loadedSubjects, user);
      setStreak(calculatedStreak);
      
      // Update streak in database
      const streakRef = ref(db, `users/${user.uid}/streak`);
      set(streakRef, calculatedStreak);
    });
    return () => unsubSubjects();
  }, [user]);

  // Break timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (breakActive && breakTimer > 0) {
      timer = setInterval(() => setBreakTimer((prev) => prev - 1), 1000);
    } else if (breakActive && breakTimer === 0) {
      setBreakActive(false);
      setBreakTimer(300);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [breakActive, breakTimer]);

  // IST clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setIstTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to toggle topic completion
  const toggleTopicCompletion = async (subjectId: string, topicIndex: number) => {
    if (!user) return;
    
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !subject.topics) return;
    
    const updatedTopics = [...subject.topics];
    const topic = updatedTopics[topicIndex];
    const todayDate = todayISO();
    
    // Toggle completion status
    topic.completed = !topic.completed;
    topic.completedDate = topic.completed ? todayDate : null;
    topic.completedAt = topic.completed ? Date.now() : null;
    
    // Update in Firebase
    const topicsRef = ref(db, `users/${user.uid}/subjects/${subjectId}/topics`);
    await set(topicsRef, updatedTopics);
    
    // Update local state
    setSubjects(prevSubjects => 
      prevSubjects.map(s => 
        s.id === subjectId ? { ...s, topics: updatedTopics } : s
      )
    );
    
    // Recalculate streak
    const updatedSubjects = subjects.map(s => 
      s.id === subjectId ? { ...s, topics: updatedTopics } : s
    );
    const newStreak = calculateStreak(updatedSubjects, user);
    setStreak(newStreak);
    
    // Update streak in database
    const streakRef = ref(db, `users/${user.uid}/streak`);
    await set(streakRef, newStreak);
  };

  if (!user) return null;

  const todayDate = todayISO();
  const activeSubjects = subjects.filter(
    (s) => todayDate >= s.startDate && todayDate <= s.endDate
  );
  
  let daysToExam = null;
  if (profile.examDate) {
    daysToExam = daysBetween(todayDate, profile.examDate);
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Modern Header Section */}
      <div className="mb-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4 animate-pulse-slow">
            {profile.name ? `Welcome back, ${profile.name}!` : "Welcome to UPSC Prep Portal!"}
          </h1>
          <p className="text-xl text-gray-300 animate-fade-in-up">
            Your journey to civil services excellence continues
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Exam Countdown Card */}
        {profile.examDate && (
          <div className="modern-card rounded-2xl p-6 text-center animate-fade-in-up">
            <div className="text-3xl mb-3">📅</div>
            <div className="text-sm text-gray-300 mb-2">परीक्षा शेष</div>
            <div className="text-3xl font-bold text-blue-400 mb-1">{daysToExam}</div>
            <div className="text-sm text-gray-400">दिन ({profile.examDate})</div>
          </div>
        )}

        {/* IST Time Card */}
        <div className="modern-card rounded-2xl p-6 text-center animate-fade-in-up animate-float">
          <div className="text-3xl mb-3">🕐</div>
          <div className="text-sm text-gray-300 mb-2">IST Time</div>
          <div className="text-2xl font-mono font-bold text-purple-400">{istTime}</div>
        </div>

        {/* Enhanced Streak Card with Fire Animation */}
        <div className="modern-card rounded-2xl p-6 text-center animate-fade-in-up relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 animate-fire-glow"></div>
          <div className="relative z-10">
            <div className="text-6xl mb-3 animate-flicker">🔥</div>
            <div className="text-sm text-gray-300 mb-2">Study Streak</div>
            <div className="text-5xl font-bold text-orange-400 animate-streak-pulse">{streak}</div>
            <div className="text-xs text-orange-300 mt-2 animate-pulse">
              {streak > 0 ? `${streak} day${streak > 1 ? 's' : ''} strong! 🚀` : 'Start your streak today! 💪'}
            </div>
            {streak > 0 && (
              <div className="mt-2">
                <div className="flex justify-center gap-1">
                  {Array.from({ length: Math.min(streak, 7) }, (_, i) => (
                    <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                  ))}
                  {streak > 7 && <span className="text-orange-300 text-xs ml-1">+{streak - 7}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Break Timer Card */}
        <div className="modern-card rounded-2xl p-6 text-center animate-fade-in-up">
          <div className="text-3xl mb-3">⏱️</div>
          <div className="text-sm text-gray-300 mb-2">Break Timer</div>
          <div className="text-2xl font-mono font-bold text-green-400 mb-3">
            {String(Math.floor(breakTimer / 60)).padStart(2, "0")}:{String(breakTimer % 60).padStart(2, "0")}
          </div>
          <div className="flex gap-2 justify-center">
            {!breakActive ? (
              <button 
                onClick={() => setBreakActive(true)} 
                className="bg-green-500/80 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:scale-105"
              >
                Start
              </button>
            ) : (
              <button 
                onClick={() => setBreakActive(false)} 
                className="bg-yellow-500/80 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:scale-105"
              >
                Pause
              </button>
            )}
            <button 
              onClick={() => { setBreakActive(false); setBreakTimer(300); }} 
              className="bg-gray-500/80 hover:bg-gray-500 text-white px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:scale-105"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Motivation Quote */}
      {profile.motivation && (
        <div className="modern-card rounded-2xl p-6 mb-12 text-center animate-fade-in-up">
          <div className="text-2xl mb-4">💪</div>
          <p className="text-lg text-yellow-300 font-medium italic">"{profile.motivation}"</p>
        </div>
      )}
      {/* Subject Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeSubjects.map((subject, index) => {
          const totalDays = daysBetween(subject.startDate, subject.endDate);
          const passedDays = daysBetween(subject.startDate, todayDate);
          const progress = Math.min(100, Math.round((passedDays / totalDays) * 100));
          const daysLeft = daysBetween(todayDate, subject.endDate);
          const getISTDate = () => {
            const now = new Date();
            const istOffset = 5.5 * 60;
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            return new Date(utc + istOffset * 60000);
          };
          const nowIST = getISTDate();
          const startDateTime = new Date(`${todayDate}T${subject.start}`);
          const endDateTime = new Date(`${todayDate}T${subject.end}`);
          let hourProgress = 0;
          if (nowIST < startDateTime) hourProgress = 0;
          else if (nowIST > endDateTime) hourProgress = 100;
          else hourProgress = Math.min(100, Math.max(0, ((nowIST.getTime() - startDateTime.getTime()) / (endDateTime.getTime() - startDateTime.getTime())) * 100));
          const afterEnd = nowIST > endDateTime;

          const topics = subject.topics || [];
          const completed = topics.filter((t: any) => t.completed && (!t.carry || t.carry === false));
          const uncompleted = topics.filter((t: any) => !t.completed || t.carry);
          const recentCompleted = completed.length > 0 ? completed[completed.length - 1] : null;
          const currentTask = uncompleted[0] || null;
          const nextTask = uncompleted[1] || null;

          const cardColors = [
            'from-blue-500/20 to-purple-500/20',
            'from-green-500/20 to-teal-500/20',
            'from-pink-500/20 to-rose-500/20',
            'from-yellow-500/20 to-orange-500/20'
          ];

          return (
            <div 
              key={subject.id} 
              className={`modern-card rounded-2xl p-6 bg-gradient-to-br ${cardColors[index % 4]} animate-fade-in-up hover:scale-105 transition-all duration-300`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-white">{subject.name}</h3>
                <div className="text-sm text-gray-300">
                  {subject.startDate} → {subject.endDate}
                </div>
              </div>

              {/* Study Time Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Study Time: {subject.start} - {subject.end}</span>
                  <span className={hourProgress === 100 ? 'text-red-400' : 'text-green-400'}>
                    {hourProgress < 100 ? `${Math.round(hourProgress)}% Complete` : 'Time Over'}
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full progress-bar transition-all duration-700"
                    style={{ width: `${hourProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Overall Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Overall Progress</span>
                  <span className={daysLeft <= 2 ? "text-red-400 font-bold animate-pulse" : "text-blue-400"}>
                    {daysLeft} days left
                  </span>
                </div>
                <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {passedDays} of {totalDays} days completed
                </div>
              </div>

              {/* Today's Tasks - Show 3 topics: Completed, Current, Next */}
              <div className="glass-dark rounded-xl p-4 mb-4">
                <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Today's Tasks
                </h4>
                <div className="space-y-3">
                  {(() => {
                    const completedTopics = topics.filter((t: any) => t.completed && t.completedDate === todayDate);
                    const pendingTopics = topics.filter((t: any) => !t.completed || t.completedDate !== todayDate);
                    
                    // Get last completed topic
                    const lastCompleted = completedTopics.length > 0 ? completedTopics[completedTopics.length - 1] : null;
                    
                    // Get current and next pending topics
                    const currentTopic = pendingTopics[0] || null;
                    const nextTopic = pendingTopics[1] || null;
                    
                    const displayTopics = [
                      lastCompleted && { ...lastCompleted, status: 'completed', index: topics.findIndex((t: any) => t.name === lastCompleted.name) },
                      currentTopic && { ...currentTopic, status: 'current', index: topics.findIndex((t: any) => t.name === currentTopic.name) },
                      nextTopic && { ...nextTopic, status: 'next', index: topics.findIndex((t: any) => t.name === nextTopic.name) }
                    ].filter(Boolean);
                    
                    return displayTopics.length > 0 ? displayTopics.map((topic: any) => (
                      <div key={topic.index} className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                        topic.status === 'completed' ? 'bg-green-500/10 border border-green-500/20' : 
                        topic.status === 'current' ? 'bg-yellow-500/10 border border-yellow-500/20' : 
                        'bg-blue-500/10 border border-blue-500/20'
                      }`}>
                        <button
                          onClick={() => toggleTopicCompletion(subject.id, topic.index)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                            topic.status === 'completed'
                              ? 'bg-green-500 border-green-500 text-white' 
                              : topic.status === 'current'
                              ? 'border-yellow-400 hover:bg-yellow-400 hover:text-white'
                              : 'border-blue-400 hover:bg-blue-400 hover:text-white'
                          }`}
                        >
                          {topic.status === 'completed' && <span className="text-sm">✓</span>}
                          {topic.status === 'current' && <span className="text-sm">●</span>}
                          {topic.status === 'next' && <span className="text-sm">○</span>}
                        </button>
                        
                        <div className="flex-1">
                          <span className={`text-sm block ${
                            topic.status === 'completed' ? 'line-through text-green-400' : 
                            topic.status === 'current' ? 'text-yellow-300 font-medium' : 'text-blue-300'
                          }`}>
                            {topic.name}
                          </span>
                          {topic.status === 'completed' && topic.completedAt && (
                            <span className="text-xs text-green-300 opacity-75">
                              Completed {new Date(topic.completedAt).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            topic.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            topic.status === 'current' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {topic.status === 'completed' ? '✓ Done' : 
                             topic.status === 'current' ? '⚡ Current' : '⏳ Next'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-gray-400 text-sm text-center py-4">
                        <div className="text-2xl mb-2">📚</div>
                        No tasks scheduled for today
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                className="w-full text-center text-xs text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center justify-center gap-1"
                onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
              >
                <span className="text-xs">{expandedSubject === subject.id ? "Hide Topics" : "Show Topics"}</span>
                <span className={`transform transition-transform duration-200 text-xs ${expandedSubject === subject.id ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Expanded Topics */}
              {expandedSubject === subject.id && (
                <div className="glass-dark rounded-xl p-4 mt-4 animate-fade-in-up">
                  <h5 className="font-semibold text-white mb-3">All Topics</h5>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {subject.topics?.map((topic: any, tIdx: number) => {
                      const isCompleted = topic.completed && topic.completedDate === todayDate;
                      
                      return (
                        <div key={topic.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <button
                            onClick={() => toggleTopicCompletion(subject.id, tIdx)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                              isCompleted 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-400 hover:border-blue-400'
                            }`}
                          >
                            {isCompleted && <span className="text-xs">✓</span>}
                          </button>
                          
                          <span className={`text-sm flex-1 ${
                            isCompleted ? 'line-through text-gray-400' : 'text-gray-200'
                          }`}>
                            {topic.name}
                          </span>
                          
                          {isCompleted && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                              ✓ Done
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {activeSubjects.length === 0 && (
        <div className="modern-card rounded-2xl p-12 text-center animate-fade-in-up">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold text-white mb-4">No Active Subjects</h3>
          <p className="text-gray-300 mb-6">Start your UPSC preparation journey by adding subjects in the Tasks section.</p>
          <a 
            href="/tasks" 
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-300"
          >
            Add Subjects
          </a>
        </div>
      )}
    </div>
  );
}
