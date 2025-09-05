import { ScrapedContent, ScrapingSource, ScrapingConfig } from '@/types';

import { supabase } from './supabase';

export interface ScrapedWord {
  word: string;
  meaning?: string;
  context?: string;
  source: string;
  sourceUrl?: string;
  confidence: number;
  category?: string;
  tags?: string[];
}

export interface ScrapingResult {
  success: boolean;
  wordsFound: number;
  wordsAdded: number;
  wordsFiltered: number;
  errors: string[];
  processingTime: number;
}

export interface ScrapingSource {
  id: string;
  name: string;
  url: string;
  type: 'reddit' | 'twitter' | 'urban-dictionary' | 'custom';
  enabled: boolean;
  lastScraped?: string;
  successRate: number;
}

interface ScrapingStats {
  totalScraped: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  sourceStats: {
    source: string;
    total: number;
    approved: number;
    rejected: number;
  }[];
}

export class DataScraperService {
  private static readonly REDDIT_API_BASE = 'https://www.reddit.com';
  private static readonly URBAN_DICT_API = 'https://api.urbandictionary.com/v0';
  private static readonly MAX_WORDS_PER_SOURCE = 100;
  private static readonly MIN_CONFIDENCE = 0.3;

  /**
   * Main scraping method that processes all enabled sources
   */
  static async runScraping(): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      success: true,
      wordsFound: 0,
      wordsAdded: 0,
      wordsFiltered: 0,
      errors: [],
      processingTime: 0,
    };

    try {
      // Get enabled scraping sources
      const sources = await this.getScrapingSources();
      
      for (const source of sources) {
        if (!source.enabled) continue;

        try {
          const sourceResult = await this.scrapeSource(source);
          result.wordsFound += sourceResult.wordsFound;
          result.wordsAdded += sourceResult.wordsAdded;
          result.wordsFiltered += sourceResult.wordsFiltered;
          
          // Update source statistics
          await this.updateSourceStats(source.id, sourceResult);
        } catch (error) {
          const errorMsg = `Failed to scrape ${source.name}: ${error}`;
          result.errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`General scraping error: ${error}`);
    } finally {
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Scrape a specific source
   */
  private static async scrapeSource(source: ScrapingSource): Promise<ScrapingResult> {
    const startTime = Date.now();
    let wordsFound = 0;
    let wordsAdded = 0;
    let wordsFiltered = 0;

    try {
      let scrapedWords: ScrapedWord[] = [];

      switch (source.type) {
        case 'reddit':
          scrapedWords = await this.scrapeReddit(source);
          break;
        case 'urban-dictionary':
          scrapedWords = await this.scrapeUrbanDictionary(source);
          break;
        case 'twitter':
          scrapedWords = await this.scrapeTwitter(source);
          break;
        case 'custom':
          scrapedWords = await this.scrapeCustomSource(source);
          break;
        default:
          throw new Error(`Unknown source type: ${source.type}`);
      }

      wordsFound = scrapedWords.length;

      // Process and filter words
      for (const word of scrapedWords) {
        try {
          const shouldAdd = await this.processScrapedWord(word);
          if (shouldAdd) {
            wordsAdded++;
          } else {
            wordsFiltered++;
          }
        } catch (error) {
          console.error(`Failed to process word ${word.word}:`, error);
        }
      }

      return {
        success: true,
        wordsFound,
        wordsAdded,
        wordsFiltered,
        errors: [],
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Scrape Reddit for slang words
   */
  private static async scrapeReddit(source: ScrapingSource): Promise<ScrapedWord[]> {
    const words: ScrapedWord[] = [];
    
    try {
      // Parse subreddit from URL
      const subredditMatch = source.url.match(/\/r\/([^\/]+)/);
      if (!subredditMatch) {
        throw new Error('Invalid Reddit URL format');
      }

      const subreddit = subredditMatch[1];
      const apiUrl = `${this.REDDIT_API_BASE}/r/${subreddit}/hot.json?limit=25`;

      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Straat-Praat-Bot/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status}`);
      }

      const data = await response.json();
      const posts = data.data?.children || [];

      for (const post of posts) {
        const postData = post.data;
        const text = `${postData.title} ${postData.selftext}`;
        
        // Extract potential slang words
        const extractedWords = this.extractSlangWords(text);
        
        for (const word of extractedWords) {
          words.push({
            word,
            source: `reddit/r/${subreddit}`,
            sourceUrl: `https://reddit.com${postData.permalink}`,
            confidence: this.calculateWordConfidence(word, text),
            category: 'reddit',
            tags: ['social-media', 'youth-culture'],
          });
        }
      }
    } catch (error) {
      console.error('Reddit scraping failed:', error);
      throw error;
    }

    return words.slice(0, this.MAX_WORDS_PER_SOURCE);
  }

  /**
   * Scrape Urban Dictionary for Dutch slang
   */
  private static async scrapeUrbanDictionary(source: ScrapingSource): Promise<ScrapedWord[]> {
    const words: ScrapedWord[] = [];
    
    try {
      // Get trending words
      const response = await fetch(`${this.URBAN_DICT_API}/trending`);
      
      if (!response.ok) {
        throw new Error(`Urban Dictionary API error: ${response.status}`);
      }

      const data = await response.json();
      const trendingWords = data.list || [];

      for (const wordData of trendingWords) {
        // Filter for Dutch-related words or words that might be relevant
        if (this.isRelevantWord(wordData.word)) {
          words.push({
            word: wordData.word,
            meaning: wordData.definition,
            context: wordData.example,
            source: 'urban-dictionary',
            sourceUrl: wordData.permalink,
            confidence: this.calculateWordConfidence(wordData.word, wordData.definition),
            category: 'urban-dictionary',
            tags: ['dictionary', 'slang'],
          });
        }
      }
    } catch (error) {
      console.error('Urban Dictionary scraping failed:', error);
      throw error;
    }

    return words.slice(0, this.MAX_WORDS_PER_SOURCE);
  }

  /**
   * Scrape Twitter (placeholder - would need Twitter API access)
   */
  private static async scrapeTwitter(source: ScrapingSource): Promise<ScrapedWord[]> {
    // This would require Twitter API access and proper authentication
    // For now, return empty array
    console.log('Twitter scraping not implemented - requires API access');
    return [];
  }

  /**
   * Scrape custom source (generic web scraping)
   */
  private static async scrapeCustomSource(source: ScrapingSource): Promise<ScrapedWord[]> {
    const words: ScrapedWord[] = [];
    
    try {
      const response = await fetch(source.url);
      
      if (!response.ok) {
        throw new Error(`Custom source error: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract text content (basic HTML parsing)
      const textContent = this.extractTextFromHTML(html);
      
      // Extract potential slang words
      const extractedWords = this.extractSlangWords(textContent);
      
      for (const word of extractedWords) {
        words.push({
          word,
          source: source.name,
          sourceUrl: source.url,
          confidence: this.calculateWordConfidence(word, textContent),
          category: 'custom',
          tags: ['web-scraping'],
        });
      }
    } catch (error) {
      console.error('Custom source scraping failed:', error);
      throw error;
    }

    return words.slice(0, this.MAX_WORDS_PER_SOURCE);
  }

  /**
   * Extract potential slang words from text
   */
  private static extractSlangWords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 3 && word.length <= 20);

    // Filter for potential slang patterns
    const slangPatterns = [
      /^[a-z]+$/i, // Only letters
      /^[a-z]+[0-9]+$/i, // Letters + numbers
      /^[0-9]+[a-z]+$/i, // Numbers + letters
      /^[a-z]+[0-9]+[a-z]+$/i, // Mixed pattern
    ];

    return words.filter(word => 
      slangPatterns.some(pattern => pattern.test(word)) &&
      !this.isCommonWord(word) &&
      !this.isStopWord(word)
    );
  }

  /**
   * Check if word is a common Dutch word
   */
  private static isCommonWord(word: string): boolean {
    const commonWords = [
      'de', 'het', 'een', 'en', 'van', 'in', 'op', 'aan', 'met', 'voor',
      'naar', 'door', 'over', 'onder', 'boven', 'naast', 'tussen', 'achter',
      'voor', 'binnen', 'buiten', 'om', 'rond', 'langs', 'door', 'via',
      'zonder', 'behalve', 'behalve', 'uitgezonderd', 'ondanks', 'niettegenstaande'
    ];
    
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Check if word is a stop word
   */
  private static isStopWord(word: string): boolean {
    const stopWords = [
      'ik', 'jij', 'hij', 'zij', 'wij', 'jullie', 'zij', 'mijn', 'jouw',
      'zijn', 'haar', 'ons', 'jullie', 'hun', 'dit', 'dat', 'deze', 'die',
      'wat', 'wie', 'waar', 'wanneer', 'waarom', 'hoe', 'welke', 'welk'
    ];
    
    return stopWords.includes(word.toLowerCase());
  }

  /**
   * Check if word is relevant for Dutch slang
   */
  private static isRelevantWord(word: string): boolean {
    // Basic heuristics for Dutch slang relevance
    const dutchPatterns = [
      /^[a-z]+$/i, // Dutch words are usually lowercase
      /^[a-z]+[0-9]+$/i, // Common pattern in Dutch slang
      /^[0-9]+[a-z]+$/i, // Another common pattern
    ];
    
    return dutchPatterns.some(pattern => pattern.test(word)) &&
           word.length >= 3 && word.length <= 15;
  }

  /**
   * Calculate confidence score for a word
   */
  private static calculateWordConfidence(word: string, context: string): number {
    let confidence = 0.5; // Base confidence
    
    // Higher confidence for longer words (more likely to be slang)
    if (word.length > 5) confidence += 0.2;
    if (word.length > 8) confidence += 0.1;
    
    // Higher confidence for words with numbers (common in slang)
    if (/\d/.test(word)) confidence += 0.2;
    
    // Higher confidence for words with repeated letters
    if (/(.)\1{2,}/.test(word)) confidence += 0.1;
    
    // Lower confidence for common word patterns
    if (this.isCommonWord(word)) confidence -= 0.3;
    
    // Context-based confidence
    if (context.toLowerCase().includes(word.toLowerCase())) {
      confidence += 0.1;
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Extract text content from HTML
   */
  private static extractTextFromHTML(html: string): string {
    // Basic HTML tag removal
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Process a scraped word and decide whether to add it
   */
  private static async processScrapedWord(scrapedWord: ScrapedWord): Promise<boolean> {
    try {
      // Check if word already exists
      const existingWord = await this.checkWordExists(scrapedWord.word);
      if (existingWord) {
        return false; // Word already exists
      }

      // Check confidence threshold
      if (scrapedWord.confidence < this.MIN_CONFIDENCE) {
        return false; // Confidence too low
      }

      // Check for inappropriate content
      if (this.containsInappropriateContent(scrapedWord.word)) {
        return false; // Inappropriate content
      }

      // Add to new_words table for moderator review
      const { error } = await supabase
        .from('new_words')
        .insert({
          word: scrapedWord.word,
          meaning: scrapedWord.meaning || 'Betekenis moet nog worden bepaald',
          context: scrapedWord.context || '',
          source: scrapedWord.source,
          source_url: scrapedWord.sourceUrl,
          confidence: scrapedWord.confidence,
          category: scrapedWord.category || 'scraped',
          tags: scrapedWord.tags || [],
          status: 'pending_review',
        });

      if (error) {
        console.error('Failed to add scraped word:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to process scraped word:', error);
      return false;
    }
  }

  /**
   * Check if word already exists in database
   */
  private static async checkWordExists(word: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('slang_words')
        .select('id')
        .or(`word.ilike.%${word}%,meaning.ilike.%${word}%`)
        .limit(1);

      if (error) {
        throw error;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Failed to check word existence:', error);
      return false;
    }
  }

  /**
   * Check for inappropriate content
   */
  private static containsInappropriateContent(word: string): boolean {
    const inappropriatePatterns = [
      /^fuck/i,
      /^shit/i,
      /^porn/i,
      /^sex/i,
      /^dick/i,
      /^pussy/i,
      /^ass/i,
      /^bitch/i,
    ];
    
    return inappropriatePatterns.some(pattern => pattern.test(word));
  }

  /**
   * Get scraping sources from database
   */
  private static async getScrapingSources(): Promise<ScrapingSource[]> {
    try {
      const { data, error } = await supabase
        .from('scraping_sources')
        .select('*')
        .eq('enabled', true)
        .order('last_scraped', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get scraping sources:', error);
      // Return default sources if database query fails
      return this.getDefaultSources();
    }
  }

  /**
   * Get default scraping sources
   */
  private static getDefaultSources(): ScrapingSource[] {
    return [
      {
        id: 'reddit-teenagers',
        name: 'Reddit r/teenagers',
        url: 'https://www.reddit.com/r/teenagers',
        type: 'reddit',
        enabled: true,
        successRate: 0.8,
      },
      {
        id: 'urban-dictionary',
        name: 'Urban Dictionary',
        url: 'https://www.urbandictionary.com',
        type: 'urban-dictionary',
        enabled: true,
        successRate: 0.7,
      },
    ];
  }

  /**
   * Update source statistics
   */
  private static async updateSourceStats(sourceId: string, result: ScrapingResult): Promise<void> {
    try {
      const successRate = result.wordsFound > 0 ? result.wordsAdded / result.wordsFound : 0;
      
      await supabase
        .from('scraping_sources')
        .update({
          last_scraped: new Date().toISOString(),
          success_rate: successRate,
        })
        .eq('id', sourceId);
    } catch (error) {
      console.error('Failed to update source stats:', error);
    }
  }

  /**
   * Get scraping statistics
   */
  static async getScrapingStats(): Promise<ScrapingStats> {
    try {
      const { data, error } = await supabase
        .from('new_words')
        .select('status, created_at, source');

      if (error) {
        throw error;
      }

      const totalScraped = data?.length || 0;
      const pendingReview = data?.filter(w => w.status === 'pending_review').length || 0;
      const approved = data?.filter(w => w.status === 'approved').length || 0;
      const rejected = data?.filter(w => w.status === 'rejected').length || 0;

      // Group by source
      const sourceStats = new Map();
      data?.forEach(word => {
        const source = word.source || 'unknown';
        if (!sourceStats.has(source)) {
          sourceStats.set(source, { total: 0, approved: 0, rejected: 0 });
        }
        const stats = sourceStats.get(source);
        stats.total++;
        if (word.status === 'approved') stats.approved++;
        if (word.status === 'rejected') stats.rejected++;
      });

      return {
        totalScraped,
        pendingReview,
        approved,
        rejected,
        sourceStats: Array.from(sourceStats.entries()).map(([source, stats]) => ({
          source,
          ...stats,
        })),
      };
    } catch (error) {
      console.error('Failed to get scraping stats:', error);
      return {
        totalScraped: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0,
        sourceStats: [],
      };
    }
  }
}
