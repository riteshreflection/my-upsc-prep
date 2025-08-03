"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiExternalLink, FiBookOpen, FiCalendar, FiClock, FiShare2 } from "react-icons/fi";
import app from "../../../../firebase";

interface ArticleContent {
  title: string;
  date: string;
  syllabus?: string;
  context?: string;
  background?: string;
  content: string[];
  source: string;
  scrapedAt: string;
}

interface ArticleResponse {
  success: boolean;
  data: ArticleContent;
  error?: string;
}

export default function ArticlePage() {
  const [user, setUser] = useState<User | null>(null);
  const [article, setArticle] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const router = useRouter();
  const params = useParams();
  const articleId = params.id as string;

  // Auth check
  useEffect(() => {
    try {
      const auth = getAuth(app);
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!firebaseUser) {
          router.replace("/login");
        } else {
          setUser(firebaseUser);
          setAuthError("");
        }
      }, (error) => {
        console.error("Auth error:", error);
        setAuthError("Authentication error occurred");
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setAuthError("Failed to initialize Firebase");
    }
  }, [router]);

  // Fetch article content
  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      
      setLoading(true);
      setError("");
      
      try {
        // Decode and clean the article URL from the ID
        let articleUrl = decodeURIComponent(articleId);
        articleUrl = articleUrl.replace(/^https?:\/\/[^\/]+https?:\/\//, 'https://');
        
        const response = await fetch(`/api/scrape-article?url=${encodeURIComponent(articleUrl)}`);
        const result: ArticleResponse = await response.json();
        
        if (result.success) {
          setArticle(result.data);
        } else {
          setError(result.error || "Failed to load article");
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        setError("Failed to load article content");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchArticle();
    }
  }, [articleId, user]);

  // Show loading or error states
  if (authError) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-400 mb-4">{authError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading article content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Article</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">Article not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
        >
          <FiArrowLeft />
          Back to Current Affairs
        </button>
      </div>

      {/* Article Header */}
      <div className="modern-card rounded-2xl p-8 mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
            {article.source}
          </span>
          <span className="text-gray-400 text-sm flex items-center gap-1">
            <FiCalendar />
            {new Date(article.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
          {article.syllabus && (
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              {article.syllabus}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <FiClock />
            Last updated: {new Date(article.scrapedAt).toLocaleString()}
          </span>
          <button className="flex items-center gap-1 hover:text-blue-400 transition-colors duration-300">
            <FiShare2 />
            Share
          </button>
        </div>
      </div>

      {/* Article Content */}
      <div className="modern-card rounded-2xl p-8 animate-fade-in-up">
        {article.context && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <FiBookOpen />
              Context
            </h2>
            <p className="text-gray-300 leading-relaxed">
              {article.context}
            </p>
          </div>
        )}

        {article.background && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-green-400 mb-3">Background</h2>
            <p className="text-gray-300 leading-relaxed">
              {article.background}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Article Content</h2>
          {article.content.map((paragraph, index) => (
            <p key={index} className="text-gray-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Source Attribution */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Source: <span className="text-blue-400">{article.source}</span>
            </div>
            <a
              href={decodeURIComponent(articleId)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
            >
              <FiExternalLink />
              View Original
            </a>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105">
          Make Notes
        </button>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105">
          Save for Later
        </button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105">
          Share Article
        </button>
      </div>
    </div>
  );
} 