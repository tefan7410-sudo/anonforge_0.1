import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ModerationResult {
  isSafe: boolean;
  flaggedCategories: string[];
  confidence: number;
  message?: string;
}

async function moderateImage(imageUrl?: string, imageBase64?: string): Promise<ModerationResult> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation not configured' };
  }

  const imageContent = imageUrl 
    ? { type: "image_url", image_url: { url: imageUrl } }
    : { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } };

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system. Analyze the provided image and determine if it contains any inappropriate content.

Check for the following categories:
- NSFW/Sexual content (nudity, sexually explicit or suggestive content)
- Violence/Gore (graphic violence, blood, gore)
- Hate symbols (racist symbols, hate group imagery)
- Illegal content (drugs, weapons being used illegally)
- Child safety concerns (any content that could harm minors)
- Harassment/Bullying imagery

Respond ONLY with a JSON object in this exact format:
{
  "isSafe": true/false,
  "flaggedCategories": ["category1", "category2"],
  "confidence": 0.0-1.0,
  "message": "Brief explanation if flagged"
}

Be strict about safety but don't flag artistic content, cartoons, or clearly safe imagery. NFT art may contain stylized characters which are acceptable.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image for content moderation:' },
              imageContent
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation temporarily unavailable' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isSafe: result.isSafe ?? true,
          flaggedCategories: result.flaggedCategories ?? [],
          confidence: result.confidence ?? 0.5,
          message: result.message,
        };
      }
    } catch (parseError) {
      console.error('Failed to parse moderation response:', parseError);
    }

    return { isSafe: true, flaggedCategories: [], confidence: 0.5 };
  } catch (error) {
    console.error('Moderation error:', error);
    return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation error' };
  }
}

async function moderateText(text: string, context?: string): Promise<ModerationResult> {
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation not configured' };
  }

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system. Analyze the provided text and determine if it contains inappropriate content.

Check for:
- Hate speech or slurs (racist, homophobic, etc.)
- Sexual content or innuendo
- Violence or threats
- Harassment or bullying language
- Illegal activity references
- Impersonation of public figures (unless clearly parody)

Context: ${context || 'User-provided content for a public NFT platform'}

Respond ONLY with a JSON object:
{
  "isSafe": true/false,
  "flaggedCategories": ["category1"],
  "confidence": 0.0-1.0,
  "message": "Brief explanation if flagged"
}

Be reasonable - creative names and artistic expressions are acceptable. Only flag clearly problematic content.`
          },
          {
            role: 'user',
            content: `Analyze this text for moderation: "${text}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation temporarily unavailable' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          isSafe: result.isSafe ?? true,
          flaggedCategories: result.flaggedCategories ?? [],
          confidence: result.confidence ?? 0.5,
          message: result.message,
        };
      }
    } catch (parseError) {
      console.error('Failed to parse text moderation response:', parseError);
    }

    return { isSafe: true, flaggedCategories: [], confidence: 0.5 };
  } catch (error) {
    console.error('Text moderation error:', error);
    return { isSafe: true, flaggedCategories: [], confidence: 0, message: 'Moderation error' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, imageUrl, imageBase64, text, context } = await req.json();

    let result: ModerationResult;

    if (type === 'image') {
      result = await moderateImage(imageUrl, imageBase64);
    } else if (type === 'text') {
      result = await moderateText(text, context);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid moderation type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Moderation result:', { type, isSafe: result.isSafe, flaggedCategories: result.flaggedCategories });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Content moderation error:', error);
    return new Response(JSON.stringify({ 
      isSafe: true, 
      flaggedCategories: [], 
      confidence: 0,
      message: 'Error processing request' 
    }), {
      status: 200, // Return 200 to not block uploads on moderation errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
