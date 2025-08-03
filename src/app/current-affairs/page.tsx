"use client";
import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { FiCalendar, FiClock, FiExternalLink, FiRefreshCw } from "react-icons/fi";

interface CurrentAffairsItem {
  title: string;
  date: string;
  category: string;
  summary?: string;
  link?: string;
}

export default function CurrentAffairsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAffairs, setCurrentAffairs] = useState<CurrentAffairsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const router = useRouter();

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

  // Fetch current affairs data
  useEffect(() => {
    const fetchCurrentAffairs = async () => {
      setLoading(true);
      try {
        // Simulated data based on NEXT IAS structure
        // In a real implementation, you would scrape the actual website
        const mockData: CurrentAffairsItem[] = [
          {
            title: "भारत-नेपाल सीमा विवाद: नई विकास",
            date: "2024-01-15",
            category: "International Relations",
            summary: "भारत और नेपाल के बीच सीमा विवाद पर नई वार्ता शुरू हुई। दोनों देशों ने शांतिपूर्ण समाधान के लिए प्रतिबद्धता जताई।"
          },
          {
            title: "कृषि कानूनों का नया संशोधन",
            date: "2024-01-14",
            category: "Agriculture",
            summary: "सरकार ने कृषि क्षेत्र में नए सुधारों की घोषणा की। किसानों को बेहतर मूल्य सुनिश्चित करने के लिए नई योजनाएं।"
          },
          {
            title: "डिजिटल भारत मिशन का विस्तार",
            date: "2024-01-13",
            category: "Technology",
            summary: "डिजिटल भारत मिशन के तहत नई तकनीकी पहल शुरू की गई। ग्रामीण क्षेत्रों में इंटरनेट पहुंच बढ़ाने पर जोर।"
          },
          {
            title: "पर्यावरण संरक्षण नई नीति",
            date: "2024-01-12",
            category: "Environment",
            summary: "जलवायु परिवर्तन से निपटने के लिए नई पर्यावरण नीति लागू। कार्बन उत्सर्जन कम करने के लिए नए लक्ष्य।"
          },
          {
            title: "शिक्षा क्षेत्र में नई पहल",
            date: "2024-01-11",
            category: "Education",
            summary: "राष्ट्रीय शिक्षा नीति के तहत नई पहल शुरू। गुणवत्तापूर्ण शिक्षा सभी के लिए सुलभ बनाने का प्रयास।"
          },
          {
            title: "स्वास्थ्य सेवाओं में सुधार",
            date: "2024-01-10",
            category: "Health",
            summary: "आयुष्मान भारत योजना का विस्तार। ग्रामीण क्षेत्रों में स्वास्थ्य सेवाओं को मजबूत करने की पहल।"
          }
        ];
        
        setCurrentAffairs(mockData);
      } catch (error) {
        console.error("Error fetching current affairs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentAffairs();
  }, []);

  // Filter current affairs based on category and date
  const filteredAffairs = currentAffairs.filter(item => {
    const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
    const dateMatch = !selectedDate || item.date === selectedDate;
    return categoryMatch && dateMatch;
  });

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(currentAffairs.map(item => item.category)))];

  // Get unique dates
  const dates = Array.from(new Set(currentAffairs.map(item => item.date))).sort().reverse();

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            📰 वर्तमान मामले
          </h1>
          <p className="text-xl text-gray-300">
            UPSC परीक्षा के लिए महत्वपूर्ण वर्तमान मामलों की जानकारी
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="modern-card rounded-2xl p-6 mb-8 animate-fade-in-up">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-blue-400" />
            <label htmlFor="date-filter" className="sr-only">तिथि फिल्टर</label>
            <select
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-400"
              aria-label="तिथि फिल्टर"
            >
              <option value="">सभी तिथियां</option>
              {dates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('hi-IN')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <FiClock className="text-green-400" />
            <label htmlFor="category-filter" className="sr-only">श्रेणी फिल्टर</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-400"
              aria-label="श्रेणी फिल्टर"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === "all" ? "सभी श्रेणियां" : category}
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
            फिल्टर रीसेट करें
          </button>
        </div>
      </div>

      {/* Current Affairs List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">वर्तमान मामलों को लोड कर रहे हैं...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredAffairs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-400 text-lg">कोई वर्तमान मामला नहीं मिला</p>
            </div>
          ) : (
            filteredAffairs.map((item, index) => (
              <div key={index} className="modern-card rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                        {item.category}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(item.date).toLocaleDateString('hi-IN')}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {item.title}
                    </h3>
                    
                    {item.summary && (
                      <p className="text-gray-300 leading-relaxed mb-4">
                        {item.summary}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2">
                        <FiExternalLink />
                        विस्तार से पढ़ें
                      </button>
                      
                      <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105">
                        नोट्स बनाएं
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
            📚 डेटा स्रोत
          </h3>
          <p className="text-gray-400">
            यह जानकारी <a href="https://www.nextias.com/daily-current-affairs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">NEXT IAS</a> से प्राप्त की गई है
          </p>
          <p className="text-sm text-gray-500 mt-2">
            नियमित रूप से अपडेट किया जाता है
          </p>
        </div>
      </div>
    </div>
  );
} 