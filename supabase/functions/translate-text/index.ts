import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Environment variables
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface TranslationRequest {
  text: string
  target: 'formal' | 'slang'
  context?: string
  userId?: string
}

interface TranslationResponse {
  translation: string
  confidence: number
  alternatives?: string[]
  explanation?: string
  source: 'ai' | 'database' | 'fallback'
  model?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { text, target, context, userId }: TranslationRequest = await req.json()

    if (!text || !target) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: text and target' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!['formal', 'slang'].includes(target)) {
      return new Response(
        JSON.stringify({ error: 'Target must be either "formal" or "slang"' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Try database lookup first
    const dbResult = await tryDatabaseLookup(text, target)
    if (dbResult && dbResult.confidence > 0.8) {
      await logTranslation(user.id, text, dbResult.translation, target, 'database', dbResult.confidence)
      return new Response(
        JSON.stringify(dbResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Try AI translation
    const aiResult = await tryAITranslation(text, target, context)
    if (aiResult && aiResult.confidence > 0.6) {
      await logTranslation(user.id, text, aiResult.translation, target, 'ai', aiResult.confidence)
      return new Response(
        JSON.stringify(aiResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Fallback to rule-based translation
    const fallbackResult = getFallbackTranslation(text, target)
    await logTranslation(user.id, text, fallbackResult.translation, target, 'fallback', fallbackResult.confidence)
    
    return new Response(
      JSON.stringify(fallbackResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Translation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function tryDatabaseLookup(text: string, target: 'formal' | 'slang'): Promise<TranslationResponse | null> {
  try {
    const { data, error } = await supabase
      .from('slang_words')
      .select('*')
      .or(`word.ilike.%${text}%,meaning.ilike.%${text}%`)
      .limit(5)

    if (error || !data || data.length === 0) {
      return null
    }

    // Check for exact matches
    const exactMatch = data.find(word => 
      word.word.toLowerCase() === text.toLowerCase() ||
      word.meaning?.toLowerCase() === text.toLowerCase()
    )

    if (exactMatch) {
      const translation = target === 'formal' 
        ? exactMatch.meaning 
        : exactMatch.word

      return {
        translation: translation || text,
        confidence: 0.95,
        alternatives: data.slice(0, 3).map(word => 
          target === 'formal' ? word.meaning : word.word
        ).filter(Boolean),
        explanation: `Exact match found in database: ${exactMatch.word} → ${exactMatch.meaning}`,
        source: 'database'
      }
    }

    // Partial match
    if (data.length > 0) {
      const bestMatch = data[0]
      const translation = target === 'formal' 
        ? bestMatch.meaning 
        : bestMatch.word

      return {
        translation: translation || text,
        confidence: 0.7,
        alternatives: data.slice(1, 3).map(word => 
          target === 'formal' ? word.meaning : word.word
        ).filter(Boolean),
        explanation: 'Similar words found in database',
        source: 'database'
      }
    }

    return null
  } catch (error) {
    console.error('Database lookup error:', error)
    return null
  }
}

async function tryAITranslation(text: string, target: 'formal' | 'slang', context?: string): Promise<TranslationResponse | null> {
  // Try OpenAI first, then Claude as fallback
  const openaiResult = await tryOpenAITranslation(text, target, context)
  if (openaiResult) return openaiResult

  const claudeResult = await tryClaudeTranslation(text, target, context)
  if (claudeResult) return claudeResult

  return null
}

async function tryOpenAITranslation(text: string, target: 'formal' | 'slang', context?: string): Promise<TranslationResponse | null> {
  if (!OPENAI_API_KEY) return null

  try {
    const prompt = createTranslationPrompt(text, target, context)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert in Nederlandse jongerenslang en formele taal. Geef alleen de vertaling terug, geen extra tekst.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const translation = data.choices[0]?.message?.content?.trim()

    if (!translation) return null

    // Calculate confidence based on response quality
    const confidence = calculateConfidence(text, translation, target)

    return {
      translation,
      confidence,
      source: 'ai',
      model: 'gpt-4',
      usage: data.usage,
      explanation: `AI translation using GPT-4 (confidence: ${(confidence * 100).toFixed(1)}%)`
    }

  } catch (error) {
    console.error('OpenAI translation error:', error)
    return null
  }
}

async function tryClaudeTranslation(text: string, target: 'formal' | 'slang', context?: string): Promise<TranslationResponse | null> {
  if (!ANTHROPIC_API_KEY) return null

  try {
    const prompt = createTranslationPrompt(text, target, context)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const translation = data.content[0]?.text?.trim()

    if (!translation) return null

    const confidence = calculateConfidence(text, translation, target)

    return {
      translation,
      confidence,
      source: 'ai',
      model: 'claude-3-sonnet',
      usage: {
        prompt_tokens: data.usage?.input_tokens || 0,
        completion_tokens: data.usage?.output_tokens || 0,
        total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      explanation: `AI translation using Claude (confidence: ${(confidence * 100).toFixed(1)}%)`
    }

  } catch (error) {
    console.error('Claude translation error:', error)
    return null
  }
}

function createTranslationPrompt(text: string, target: 'formal' | 'slang', context?: string): string {
  const direction = target === 'formal' ? 'jongerenslang naar formele Nederlandse taal' : 'formele Nederlandse taal naar jongerenslang'
  
  let prompt = `Vertaal het volgende woord/frase van ${direction}:\n\n`
  prompt += `"${text}"\n\n`
  
  if (context) {
    prompt += `Context: ${context}\n\n`
  }
  
  prompt += `Geef alleen de vertaling terug, geen extra uitleg of tekst.`
  
  return prompt
}

function calculateConfidence(original: string, translation: string, target: 'formal' | 'slang'): number {
  // Basic confidence calculation based on response quality
  let confidence = 0.5

  // Higher confidence if translation is different from original
  if (translation.toLowerCase() !== original.toLowerCase()) {
    confidence += 0.2
  }

  // Higher confidence if translation has reasonable length
  const lengthRatio = translation.length / original.length
  if (lengthRatio > 0.5 && lengthRatio < 3) {
    confidence += 0.1
  }

  // Higher confidence if translation doesn't contain obvious errors
  if (!translation.includes('undefined') && !translation.includes('null')) {
    confidence += 0.1
  }

  // Cap at 0.9 to leave room for human review
  return Math.min(confidence, 0.9)
}

function getFallbackTranslation(text: string, target: 'formal' | 'slang'): TranslationResponse {
  const lowerText = text.toLowerCase()
  
  const slangToFormal: Record<string, string> = {
    'bruh': 'jongen',
    'cap': 'lieg',
    'no cap': 'echt waar',
    'sus': 'verdacht',
    'based': 'cool',
    'facts': 'eens',
    'vibe': 'sfeer',
    'slay': 'geweldig doen',
    'w': 'win',
    'l': 'verlies',
    'fr': 'echt waar',
    'ngl': 'niet gaan liegen',
    'tbh': 'om eerlijk te zijn',
    'imo': 'naar mijn mening',
    'btw': 'trouwens',
    'idk': 'ik weet het niet',
    'rn': 'nu',
    'ttyl': 'spreek je later',
    'brb': 'ben zo terug',
    'afk': 'niet aanwezig',
    'lit': 'geweldig',
    'fire': 'geweldig',
    'sick': 'geweldig',
    'dope': 'cool',
    'savage': 'brutaal',
    'flex': 'opscheppen',
    'salty': 'boos',
    'thirsty': 'wanhopig',
    'ghosting': 'negeren',
    'sliding into dms': 'berichten sturen',
  }

  const formalToSlang: Record<string, string> = {
    'jongen': 'bruh',
    'lieg': 'cap',
    'echt waar': 'no cap',
    'verdacht': 'sus',
    'cool': 'based',
    'eens': 'facts',
    'sfeer': 'vibe',
    'geweldig doen': 'slay',
    'win': 'w',
    'verlies': 'l',
    'geweldig': 'lit',
    'brutaal': 'savage',
    'opscheppen': 'flex',
    'boos': 'salty',
    'wanhopig': 'thirsty',
    'negeren': 'ghosting',
    'berichten sturen': 'sliding into dms',
  }

  let translation = text
  let confidence = 0.1

  if (target === 'formal') {
    translation = slangToFormal[lowerText] || text
    confidence = slangToFormal[lowerText] ? 0.6 : 0.1
  } else {
    translation = formalToSlang[lowerText] || text
    confidence = formalToSlang[lowerText] ? 0.6 : 0.1
  }

  return {
    translation,
    confidence,
    source: 'fallback',
    explanation: confidence > 0.1 ? 'Rule-based translation' : 'No translation found'
  }
}

async function logTranslation(
  userId: string, 
  originalText: string, 
  translation: string, 
  target: 'formal' | 'slang', 
  source: string, 
  confidence: number
) {
  try {
    await supabase
      .from('translation_logs')
      .insert({
        user_id: userId,
        original_text: originalText,
        translation: translation,
        target_language: target,
        source: source,
        confidence: confidence,
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log translation:', error)
  }
}
