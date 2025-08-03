import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedItem {
  title: string;
  date: string;
  category: string;
  type: 'headlines' | 'daily' | 'editorial';
  syllabus?: string;
  context?: string;
  summary?: string;
  link?: string;
  source: 'NEXT IAS' | 'Vajiram & Ravi';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'daily';
    const source = searchParams.get('source') || 'nextias';
    
    let scrapedData: ScrapedItem[] = [];
    
    if (source === 'nextias') {
      // Scrape from NEXT IAS
      scrapedData = await scrapeNextIAS(type);
    } else if (source === 'vajiram') {
      // Scrape from Vajiram & Ravi
      scrapedData = await scrapeVajiram(type);
    } else {
      // Scrape from both sources
      const nextiasData = await scrapeNextIAS(type);
      const vajiramData = await scrapeVajiram(type);
      scrapedData = [...nextiasData, ...vajiramData];
    }
    
    // Remove duplicates and limit results
    const uniqueData = scrapedData.filter((item, index, self) => 
      index === self.findIndex(t => t.title === item.title)
    ).slice(0, 30);
    
    return NextResponse.json({
      success: true,
      data: uniqueData,
      count: uniqueData.length,
      source: source === 'nextias' ? 'NEXT IAS' : source === 'vajiram' ? 'Vajiram & Ravi' : 'Multiple Sources',
      scrapedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Fallback to mock data if scraping fails
    const mockData: ScrapedItem[] = [
      {
        title: "Linguistic Reorganisation of States in India",
        date: "2025-08-02",
        category: "Polity and Governance",
        type: "daily",
        syllabus: "GS2/ Polity and Governance",
        context: "The Tamil Nadu Governor recently criticised the linguistic division of states in India.",
        summary: "The States Reorganisation Act, 1956 established a unified system of 14 states and 6 union territories.",
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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: mockData,
      count: mockData.length,
      source: 'Mock Data (Scraping Failed)',
      scrapedAt: new Date().toISOString()
    });
  }
}

async function scrapeNextIAS(type: string): Promise<ScrapedItem[]> {
  const baseUrl = 'https://www.nextias.com/daily-current-affairs';
  const response = await fetch(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NEXT IAS: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const scrapedData: ScrapedItem[] = [];
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0];
  
  // Scrape based on type
  if (type === 'daily') {
    // Look for article sections with headings and "Read More" links
    $('h3, h4, h5').each((index, element) => {
      const title = $(element).text().trim();
      
      // Skip navigation and non-article headings
      if (title && 
          title.length > 10 && 
          !title.includes('Menu') && 
          !title.includes('Navigation') &&
          !title.includes('UPSC') &&
          !title.includes('Current Affairs') &&
          !title.includes('NEXT IAS') &&
          !title.includes('Daily Current Affairs')) {
        
        // Find the parent container and look for "Read More" link
        const parentContainer = $(element).closest('div, article, section');
        const readMoreLink = parentContainer.find('a:contains("Read More"), a:contains("Read more")').attr('href');
        
        // Extract context from the same container
        const contextElement = parentContainer.find('p, div').first();
        const context = contextElement.text().trim().substring(0, 200);
        
        // Extract syllabus if available
        const syllabusElement = parentContainer.find('p:contains("Syllabus:")');
        const syllabus = syllabusElement.text().trim();
        
        // Clean and construct the full URL
        let fullLink = undefined;
        if (readMoreLink) {
          if (readMoreLink.startsWith('http')) {
            fullLink = readMoreLink;
          } else {
            fullLink = `https://www.nextias.com${readMoreLink}`;
          }
        }
        
        scrapedData.push({
          title,
          date: formattedDate,
          category: 'Current Affairs',
          type: 'daily',
          link: fullLink,
          context: context || undefined,
          syllabus: syllabus || undefined,
          source: 'NEXT IAS'
        });
      }
    });
    
    // If no articles found with headings, try alternative approach
    if (scrapedData.length === 0) {
      $('a[href*="/ca/current-affairs/"]').each((index, element) => {
        const title = $(element).text().trim();
        let link = $(element).attr('href');
        const parentElement = $(element).closest('div, article, section');
        const dateText = parentElement.find('.date, .published-date, time').text().trim();
        
        // Fix malformed URLs
        if (link) {
          link = link.replace(/^https?:\/\/[^\/]+https?:\/\//, 'https://');
          if (!link.startsWith('http')) {
            link = `https://www.nextias.com${link}`;
          }
        }
        
        if (title && title.length > 10) {
          scrapedData.push({
            title,
            date: dateText || formattedDate,
            category: 'Current Affairs',
            type: 'daily',
            link: link || undefined,
            source: 'NEXT IAS'
          });
        }
      });
    }
  } else if (type === 'headlines') {
    $('.headlines-item, .news-item').each((index, element) => {
      const title = $(element).find('h3, h4, .title').first().text().trim();
      const link = $(element).find('a').attr('href');
      
      if (title) {
        scrapedData.push({
          title,
          date: formattedDate,
          category: 'Headlines',
          type: 'headlines',
          link: link ? `https://www.nextias.com${link}` : undefined,
          source: 'NEXT IAS'
        });
      }
    });
  } else if (type === 'editorial') {
    $('.editorial-item, .analysis-item').each((index, element) => {
      const title = $(element).find('h3, h4, .title').first().text().trim();
      const link = $(element).find('a').attr('href');
      
      if (title) {
        scrapedData.push({
          title,
          date: formattedDate,
          category: 'Editorial Analysis',
          type: 'editorial',
          link: link ? `https://www.nextias.com${link}` : undefined,
          source: 'NEXT IAS'
        });
      }
    });
  }
  
  return scrapedData;
}

async function scrapeVajiram(type: string): Promise<ScrapedItem[]> {
  // Get current date for Vajiram URL
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  
  const baseUrl = `https://vajiramandravi.com/current-affairs/upsc-prelims-current-affairs/${year}/${month}/${day}/`;
  
  const response = await fetch(baseUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Vajiram: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const scrapedData: ScrapedItem[] = [];
  const formattedDate = `${year}-${month}-${day}`;
  
  // Vajiram has a simpler structure - look for article headings
  $('h2, h3, h4').each((index, element) => {
    const title = $(element).text().trim();
    const link = $(element).find('a').attr('href') || $(element).closest('a').attr('href');
    
    // Filter out navigation and non-article headings
    if (title && 
        title.length > 10 && 
        !title.includes('Menu') && 
        !title.includes('Navigation') &&
        !title.includes('UPSC') &&
        !title.includes('Current Affairs') &&
        !title.includes('Vajiram')) {
      
      // Try to find related content
      const contentElement = $(element).next('p, div');
      const summary = contentElement.text().trim().substring(0, 200);
      
      scrapedData.push({
        title,
        date: formattedDate,
        category: 'Current Affairs',
        type: 'daily',
        link: link ? (link.startsWith('http') ? link : `https://vajiramandravi.com${link}`) : undefined,
        summary: summary || undefined,
        source: 'Vajiram & Ravi'
      });
    }
  });
  
  // If no headings found, try alternative approach
  if (scrapedData.length === 0) {
    $('p').each((index, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 50 && text.includes('Latest News')) {
        const titleMatch = text.match(/^([^:]+):/);
        if (titleMatch) {
          scrapedData.push({
            title: titleMatch[1].trim(),
            date: formattedDate,
            category: 'Current Affairs',
            type: 'daily',
            summary: text.substring(titleMatch[0].length).trim(),
            source: 'Vajiram & Ravi'
          });
        }
      }
    });
  }
  
  return scrapedData;
} 