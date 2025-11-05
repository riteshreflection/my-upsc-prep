"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  FiActivity,
  FiAperture,
  FiBookOpen,
  FiCheckCircle,
  FiClock,
  FiRefreshCcw,
  FiTrendingUp,
} from "react-icons/fi";

interface Topic {
  name: string;
  completed?: boolean;
  completedDate?: string | null;
  completedAt?: number | null;
  carry?: boolean;
}

interface Subject {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  topics?: Topic[];
  [key: string]: unknown;
}

interface SubjectSummary {
  progress: number;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  recentCompletions: Topic[];
}

const MIND_MAP_WIDTH = 600;
const MIND_MAP_HEIGHT = 360;
const BASE_RADIUS = 170;

const getSummary = (subject: Subject | null): SubjectSummary => {
  if (!subject || !subject.topics || subject.topics.length === 0) {
    return {
      progress: 0,
      totalCount: subject?.topics?.length || 0,
      completedCount: 0,
      pendingCount: subject?.topics?.length || 0,
      recentCompletions: [],
    };
  }

  const total = subject.topics.length;
  const completed = subject.topics.filter((topic) => topic.completed).length;
  const pending = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const recentCompletions = subject.topics
    .filter((topic) => topic.completed)
    .slice(-3)
    .reverse();

  return { progress, totalCount: total, completedCount: completed, pendingCount: pending, recentCompletions };
};

function StudyTree({ subject, summary }: { subject: Subject | null; summary: SubjectSummary }) {
  if (!subject) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center text-gray-300">
        <div className="text-3xl mb-3">🌱</div>
        Select a subject to visualize your preparation tree.
      </div>
    );
  }

  const topics = subject.topics || [];

  if (topics.length === 0) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center text-gray-300">
        <div className="text-3xl mb-3">📝</div>
        Add topics in the Tasks section to populate your learning tree.
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)] pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{subject.name} Tree Graph</h2>
            <p className="text-sm text-gray-300">
              {summary.completedCount} of {summary.totalCount} topics completed · {summary.progress}% overall progress
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
              ✓ Completed
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
              ⏳ Pending
            </span>
          </div>
        </div>

        <div className="tree-chart">
          <div className="tree-root">
            <div className="tree-root-title">{subject.name}</div>
            <div className="tree-root-meta">
              <FiActivity className="text-blue-300" />
              <span>{summary.progress}% mastery</span>
            </div>
          </div>
          <div className="tree-children">
            {topics.map((topic, index) => {
              const isCompleted = Boolean(topic.completed);
              return (
                <div key={`${topic.name}-${index}`} className={`tree-node ${isCompleted ? "complete" : "pending"}`}>
                  <div className="tree-node-index">{index + 1}</div>
                  <div className="tree-node-title">{topic.name}</div>
                  <div className="tree-node-status">{isCompleted ? "Completed" : "Focus"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StudyMindMap({ subject, summary }: { subject: Subject | null; summary: SubjectSummary }) {
  const topics = subject?.topics || [];

  if (!subject) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center text-gray-300">
        <div className="text-3xl mb-3">🧠</div>
        Choose a subject to generate a mind map of your topics.
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center text-gray-300">
        <div className="text-3xl mb-3">🧭</div>
        No topics yet. Add topics in the Tasks section to begin mapping your preparation.
      </div>
    );
  }

  const total = topics.length;
  const radius = Math.min(BASE_RADIUS + total * 4, 240);
  const nodes = topics.map((topic, index) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    const x = MIND_MAP_WIDTH / 2 + Math.cos(angle) * radius;
    const y = MIND_MAP_HEIGHT / 2 + Math.sin(angle) * radius;
    return { topic, x, y };
  });

  return (
    <div className="glass-dark rounded-3xl p-8 mind-map-wrapper">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">{subject.name} Mind Map</h2>
          <p className="text-sm text-gray-300">
            Visualize relationships between topics and identify focus areas at a glance.
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
            {summary.completedCount} mastered
          </span>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
            {summary.pendingCount} in progress
          </span>
        </div>
      </div>

      <div className="mind-map-container aspect-[5/3]">
        <svg
          className="mind-map-svg"
          viewBox={`0 0 ${MIND_MAP_WIDTH} ${MIND_MAP_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {nodes.map((node, index) => (
            <line
              key={`line-${index}`}
              x1={MIND_MAP_WIDTH / 2}
              y1={MIND_MAP_HEIGHT / 2}
              x2={node.x}
              y2={node.y}
              className={`mind-map-line ${node.topic.completed ? "is-complete" : ""}`}
            />
          ))}
        </svg>

        <div className="mind-map-center">
          <div className="mind-map-center-title">{subject.name}</div>
          <div className="mind-map-center-meta">{summary.progress}% complete</div>
        </div>

        {nodes.map((node, index) => (
          <div
            key={`node-${index}`}
            className={`mind-map-node ${node.topic.completed ? "is-complete" : "is-pending"}`}
            style={{
              left: `${(node.x / MIND_MAP_WIDTH) * 100}%`,
              top: `${(node.y / MIND_MAP_HEIGHT) * 100}%`,
            }}
          >
            <div className="mind-map-node-title">{node.topic.name}</div>
            <div className="mind-map-node-meta">
              {node.topic.completed ? "Ready for revision" : "Up next"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedStudyFlow({ subject, summary }: { subject: Subject | null; summary: SubjectSummary }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const pendingTopics = useMemo(
    () => subject?.topics?.filter((topic) => !topic.completed).slice(0, 3) || [],
    [subject]
  );

  const phases = useMemo(
    () => [
      {
        title: "Plan the Day",
        description:
          pendingTopics.length > 0
            ? `Prioritize ${pendingTopics.length} pending topic${pendingTopics.length > 1 ? "s" : ""}.`
            : "All topics scheduled. Use the time for consolidation.",
        accent: "Strategy",
        icon: FiClock,
      },
      {
        title: "Deep Study",
        description:
          pendingTopics[0]?.name
            ? `Focus on \"${pendingTopics[0].name}\" with active recall.`
            : "Review your detailed notes and summaries.",
        accent: "Focus",
        icon: FiBookOpen,
      },
      {
        title: "Revision Loop",
        description:
          summary.completedCount > 0
            ? `Revisit ${Math.min(summary.completedCount, 3)} mastered topic${summary.completedCount > 1 ? "s" : ""}.`
            : "Complete a topic to unlock revision strategies.",
        accent: "Review",
        icon: FiRefreshCcw,
      },
      {
        title: "Test & Analyse",
        description: `Track progress at ${summary.progress}% and note key learnings.`,
        accent: "Assessment",
        icon: FiTrendingUp,
      },
    ],
    [pendingTopics, summary.completedCount, summary.progress]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % phases.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [phases.length]);

  if (!subject) {
    return (
      <div className="glass-dark rounded-3xl p-8 text-center text-gray-300">
        <div className="text-3xl mb-3">🎯</div>
        Select a subject to generate smart study animations and routines.
      </div>
    );
  }

  return (
    <div className="glass-dark rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.25),_transparent_60%)] pointer-events-none"></div>
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Animated Study Flow</h2>
            <p className="text-sm text-gray-300">
              Follow the guided loop to balance planning, deep work, revision, and assessment.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <FiAperture className="text-lg" />
            Auto-cycling every 4.5 seconds
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = index === activeIndex;
            return (
              <div key={phase.title} className={`timeline-phase ${isActive ? "is-active" : ""}`}>
                <div className="phase-indicator">
                  <Icon className="text-xl" />
                </div>
                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-indigo-200">{phase.accent}</div>
                  <h3 className="text-lg font-semibold text-white mt-1">{phase.title}</h3>
                  <p className="text-sm text-indigo-100/80 mt-2 leading-relaxed">{phase.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flow-track mt-6">
          <div className="flow-progress" style={{ width: `${((activeIndex + 1) / phases.length) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}

export default function VisualPlannerPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!user) return;
    const subjectsRef = ref(db, `users/${user.uid}/subjects`);
    const unsubscribe = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const loadedSubjects = Object.entries(data).map(([id, value]) => ({ id, ...(value as Record<string, unknown>) })) as Subject[];
      setSubjects(loadedSubjects);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null;
  const summary = useMemo(() => getSummary(selectedSubject), [selectedSubject]);

  const upcomingFocus = useMemo(
    () => selectedSubject?.topics?.filter((topic) => !topic.completed).slice(0, 4) || [],
    [selectedSubject]
  );

  if (!user) {
    return null;
  }

  if (subjects.length === 0) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4">
        <div className="glass-dark rounded-3xl p-12 text-center">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-white mb-3">Visual Planner</h1>
          <p className="text-gray-300 mb-6">
            Build your first study plan in the Tasks section to unlock tree graphs, mind maps, and animated routines.
          </p>
          <a
            href="/tasks"
            className="inline-block bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 rounded-xl font-semibold text-white hover:scale-105 transition-transform duration-300"
          >
            Create Subjects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-4">
        <div className="flex items-center gap-3 text-indigo-200">
          <FiCheckCircle className="text-2xl" />
          <span className="uppercase tracking-[0.3em] text-xs">Visual Planner</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-white">Transform Your UPSC Preparation</h1>
          <p className="text-lg text-gray-300 max-w-3xl">
            Track subjects, explore interactive tree graphs, build mind maps, and follow animated study flows tailored to your progress.
          </p>
        </div>
      </header>

      <section className="glass-dark rounded-3xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Select Subject</h2>
            <p className="text-sm text-gray-300">Switch between subjects to update the visualizations instantly.</p>
          </div>
          <div className="text-sm text-gray-300">
            {summary.progress}% complete · {summary.pendingCount} pending · {summary.completedCount} done
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {subjects.map((subject) => {
            const subjectSummary = getSummary(subject);
            const isSelected = subject.id === selectedSubjectId;
            return (
              <button
                key={subject.id}
                className={`subject-chip ${isSelected ? "is-selected" : ""}`}
                onClick={() => setSelectedSubjectId(subject.id)}
              >
                <span>{subject.name}</span>
                <span className="subject-chip-progress">{subjectSummary.progress}%</span>
              </button>
            );
          })}
        </div>
      </section>

      {upcomingFocus.length > 0 && (
        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingFocus.map((topic, index) => (
            <div key={`${topic.name}-${index}`} className="focus-card">
              <div className="focus-card-index">#{index + 1}</div>
              <div className="focus-card-title">{topic.name}</div>
              <div className="focus-card-meta">Deep work session recommended</div>
            </div>
          ))}
        </section>
      )}

      <StudyTree subject={selectedSubject} summary={summary} />
      <StudyMindMap subject={selectedSubject} summary={summary} />
      <AnimatedStudyFlow subject={selectedSubject} summary={summary} />
    </div>
  );
}
