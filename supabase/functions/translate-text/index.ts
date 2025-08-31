import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, target } = await req.json()

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

    // Simple fallback translation
    const translation = getFallbackTranslation(text, target)

    return new Response(
      JSON.stringify({
        translation: translation || text,
        confidence: translation ? 0.6 : 0.1,
        source: translation ? 'fallback' : 'none'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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

function getFallbackTranslation(text: string, target: string): string | null {
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

  if (target === 'formal') {
    return slangToFormal[lowerText] || null
  } else {
    return formalToSlang[lowerText] || null
  }
}
