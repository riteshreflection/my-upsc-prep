import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleUrl = searchParams.get('url');
    
    if (!articleUrl) {
      return NextResponse.json({
        success: false,
        error: 'Article URL is required'
      });
    }

    // Fix malformed URLs
    let cleanUrl = decodeURIComponent(articleUrl);
    cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+https?:\/\//, 'https://');
    
    // Fetch the article page
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch article: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract article title
    const title = $('h1, .article-title, .entry-title').first().text().trim() || 
                  $('title').text().trim().replace(' - NEXT IAS', '').replace(' | NEXT IAS', '');
    
    // Extract date
    const dateText = $('.published-date, .date, time').first().text().trim() || 
                     $('.meta-date').text().trim() ||
                     new Date().toISOString().split('T')[0];
    
    // Extract syllabus
    const syllabus = $('.syllabus, .gs-syllabus').text().trim() || 
                     $('p:contains("Syllabus:")').text().trim() ||
                     $('strong:contains("Syllabus:")').next('p').text().trim();
    
    // Extract context
    const context = $('h2:contains("Context"), h3:contains("Context")').next('p').text().trim() ||
                   $('p:contains("Context:")').text().trim() ||
                   $('strong:contains("Context:")').next('p').text().trim();
    
    // Extract background
    const background = $('h2:contains("Background"), h3:contains("Background")').next('p').text().trim() ||
                      $('p:contains("Background:")').text().trim() ||
                      $('strong:contains("Background:")').next('p').text().trim();
    
    // Extract main content - improved for NEXT IAS structure
    const content: string[] = [];
    
    // Look for article content in various selectors
    const contentSelectors = [
      '.article-content',
      '.entry-content',
      '.post-content',
      '.content-area',
      'article .content',
      '.main-content',
      '.article-body',
      '.post-body'
    ];
    
    let contentElement = null;
    for (const selector of contentSelectors) {
      contentElement = $(selector);
      if (contentElement.length > 0) break;
    }
    
    if (!contentElement || contentElement.length === 0) {
      // Fallback: get all paragraphs from the main area
      contentElement = $('article p, .main p, .content p, .post p');
    }
    
    contentElement.each((index, element) => {
      const text = $(element).text().trim();
      if (text && text.length > 20 && !text.includes('©') && !text.includes('NEXT IAS')) { // Filter out short paragraphs and footer content
        content.push(text);
      }
    });
    
    // If no content found, try alternative approach - look for specific sections
    if (content.length === 0) {
      // Look for sections with headings like "Context", "Background", "Key Points", etc.
      $('h2, h3, h4').each((index, element) => {
        const heading = $(element).text().trim();
        const nextParagraphs = $(element).nextUntil('h2, h3, h4').filter('p');
        
        nextParagraphs.each((pIndex, pElement) => {
          const text = $(pElement).text().trim();
          if (text && text.length > 20) {
            content.push(text);
          }
        });
      });
    }
    
    // If still no content, try getting all paragraphs
    if (content.length === 0) {
      $('p').each((index, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 50 && !text.includes('©') && !text.includes('NEXT IAS') && !text.includes('Call')) {
          content.push(text);
        }
      });
    }
    
    // Remove duplicates and limit content
    const uniqueContent = content.filter((item, index, self) => 
      index === self.findIndex(t => t === item)
    ).slice(0, 20);
    
    const articleData: ArticleContent = {
      title,
      date: dateText,
      syllabus: syllabus || undefined,
      context: context || undefined,
      background: background || undefined,
      content: uniqueContent,
      source: 'NEXT IAS',
      scrapedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: articleData
    });
    
  } catch (error) {
    console.error('Article scraping error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        title: "Article Not Available",
        date: new Date().toISOString().split('T')[0],
        content: ["This article could not be loaded. Please try again later or visit the original source."],
        source: 'Error',
        scrapedAt: new Date().toISOString()
      }
    });
  }
} 