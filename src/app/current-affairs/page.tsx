"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FiCalendar, FiClock, FiExternalLink, FiRefreshCw, FiBookOpen, FiFileText, FiGlobe } from "react-icons/fi";
import app from "../../firebase";

interface CurrentAffairsItem {
  title: string;
  date: string;
  category: string;
  summary?: string;
  link?: string;
  type: 'headlines' | 'daily' | 'editorial';
  syllabus?: string;
  context?: string;
  source: 'NEXT IAS' | 'Vajiram & Ravi';
}

interface ScrapingResponse {
  success: boolean;
  data: CurrentAffairsItem[];
  count: number;
  source: string;
  scrapedAt: string;
  error?: string;
}

export default function CurrentAffairsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'headlines' | 'daily' | 'editorial'>('daily');
  const [selectedSource, setSelectedSource] = useState<'nextias' | 'vajiram' | 'both'>('both');
  const [scrapingStatus, setScrapingStatus] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const router = useRouter();

  // Auth check with proper error handling
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

  // Fetch current affairs data from scraping API
  const fetchCurrentAffairs = async (type: 'headlines' | 'daily' | 'editorial' = 'daily') => {
    setLoading(true);
    setScrapingStatus("🔄 Scraping data from selected sources...");
    
    try {
      const response = await fetch(`/api/scrape-current-affairs?type=${type}&source=${selectedSource}`);
      const result: ScrapingResponse = await response.json();
      
      if (result.success) {
        setCurrentAffairs(result.data);
        setScrapingStatus(`✅ Successfully scraped ${result.count} items from ${result.source}`);
        setLastUpdated(result.scrapedAt);
      } else {
        setCurrentAffairs(result.data); // Use fallback data
        setScrapingStatus(`⚠️ Using fallback data (${result.error})`);
        setLastUpdated(result.scrapedAt);
      }
    } catch (error) {
      console.error("Error fetching current affairs:", error);
      setScrapingStatus("❌ Failed to fetch data from sources");
      
      // Fallback to mock data
      const fallbackData: CurrentAffairsItem[] = [
        {
          title: "Linguistic Reorganisation of States in India",
          date: "2025-08-02",
          category: "Polity and Governance",
          type: "daily",
          syllabus: "GS2/ Polity and Governance",
          context: "The Tamil Nadu Governor recently criticised the linguistic division of states in India, calling it a factor in the creation of 'second-class citizens'.",
          summary: "The States Reorganisation Act, 1956 abolished the existing classification of states into Part A, B, C, and D, establishing a unified system of 14 states and 6 union territories.",
          source: "NEXT IAS"
        },
        {
          title: "Human Outer Planet Exploration (HOPE)",
          date: "2025-08-02",
          category: "Science and Technology",
          type: "daily",
          syllabus: "GS3/ Science and Technology",
          context: "Bengaluru-based space tech company Protoplanet, along with ISRO, has developed the analogue station.",
          summary: "HOPE is an analogue site mimicking geological and environmental conditions found on the Moon and Mars.",
          source: "Vajiram & Ravi"
        }
      ];
      setCurrentAffairs(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchCurrentAffairs(activeTab);
  }, [activeTab, selectedSource]);

  // Handle tab change
  const handleTabChange = (tab: 'headlines' | 'daily' | 'editorial') => {
    setActiveTab(tab);
    fetchCurrentAffairs(tab);
  };

  // Handle source change
  const handleSourceChange = (source: 'nextias' | 'vajiram' | 'both') => {
    setSelectedSource(source);
    fetchCurrentAffairs(activeTab);
  };

  // Filter current affairs based on category and date
  const filteredAffairs = currentAffairs.filter(item => {
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    const dateMatch = !selectedDate || item.date === selectedDate;
    return categoryMatch && dateMatch;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(currentAffairs.map(item => item.category)))];

  // Get unique dates (sorted by latest first)
  const dates = Array.from(new Set(currentAffairs.map(item => item.date))).sort().reverse();

  // Show loading or error states
  if (authError) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
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
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            📰 Current Affairs
          </h1>
          <p className="text-xl text-gray-300">
            Real-time updates from multiple sources for UPSC preparation
          </p>
        </div>
      </div>

      {/* Source Selection */}
      <div className="modern-card rounded-2xl p-6 mb-8 animate-fade-in-up">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <FiGlobe className="text-blue-400" />
            <span className="text-white font-semibold">Source:</span>
          </div>
          
          <button
            onClick={() => handleSourceChange('nextias')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedSource === 'nextias' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <FiBookOpen />
            NEXT IAS
          </button>
          
          <button
            onClick={() => handleSourceChange('vajiram')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedSource === 'vajiram' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <FiFileText />
            Vajiram & Ravi
          </button>
          
          <button
            onClick={() => handleSourceChange('both')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              selectedSource === 'both' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
          >
            <FiGlobe />
            Both Sources
          </button>
        </div>
      </div>

      {/* Scraping Status */}
      {scrapingStatus && (
        <div className="modern-card rounded-2xl p-4 mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">{scrapingStatus}</span>
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Last updated: {new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={() => fetchCurrentAffairs(activeTab)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 text-sm"
            >
              <FiRefreshCw className="text-sm" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => handleTabChange('headlines')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'headlines' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FiFileText />
            Headlines
          </button>
          <button
            onClick={() => handleTabChange('daily')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'daily' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FiCalendar />
            Daily Analysis
          </button>
          <button
            onClick={() => handleTabChange('editorial')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'editorial' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <FiBookOpen />
            Editorial Analysis
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="modern-card rounded-2xl p-6 mb-8 animate-fade-in-up">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-blue-400" />
            <label htmlFor="date-filter" className="sr-only">Date Filter</label>
            <select
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
              aria-label="Date Filter"
            >
              <option value="">All Dates</option>
              {dates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <FiClock className="text-green-400" />
            <label htmlFor="category-filter" className="sr-only">Category Filter</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-400"
              aria-label="Category Filter"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setSelectedCategory("all");
              setSelectedDate("");
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Current Affairs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading current affairs...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAffairs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 text-lg">No current affairs found</p>
            </div>
          ) : (
            filteredAffairs.map((item, index) => (
              <div key={index} className="modern-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.source === 'NEXT IAS' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {item.source}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      {item.syllabus && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                          {item.syllabus}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {item.title}
                    </h3>
                    
                    {item.context && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-blue-400 mb-1">Context:</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{item.context}</p>
                      </div>
                    )}
                    
                    {item.summary && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-green-400 mb-1">Summary:</h4>
                        <p className="text-gray-300 leading-relaxed">{item.summary}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      {item.link ? (
                        <button 
                          onClick={() => {
                            // Fix URL encoding issue
                            const cleanUrl = item.link!.replace(/^https?:\/\/[^\/]+https?:\/\//, 'https://');
                            const encodedUrl = encodeURIComponent(cleanUrl);
                            router.push(`/current-affairs/article/${encodedUrl}`);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                          <FiExternalLink />
                          Read Full Article
                        </button>
                      ) : (
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2">
                          <FiExternalLink />
                          Read More
                        </button>
                      )}
                      
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105">
                        Make Notes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Source Information */}
      <div className="mt-12 text-center">
        <div className="modern-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-2">
            📚 Data Sources
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="https://www.nextias.com/daily-current-affairs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">NEXT IAS</a>
            <span className="text-gray-500">|</span>
            <a href="https://vajiramandravi.com/current-affairs/upsc-prelims-current-affairs/" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Vajiram & Ravi</a>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Data is automatically updated when new content is published
          </p>
        </div>
      </div>
    </div>
  );
} 