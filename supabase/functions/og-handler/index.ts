import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slugOrId = url.searchParams.get('slug');
    
    console.log(`OG Handler called with slug: ${slugOrId}`);
    
    if (!slugOrId) {
      console.log('Missing slug parameter, returning default meta');
      return new Response(JSON.stringify({
        title: 'AnonForge: Discover & mint unique NFTs',
        description: 'Browse curated collections from independent creators, or build and launch your own NFT project with built-in minting powered by NMKR.',
        image: 'https://anonforge.net/og-image.png',
        url: 'https://anonforge.net',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for unrestricted access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if it's a UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    
    console.log(`Looking up collection by ${isUUID ? 'UUID' : 'slug'}: ${slugOrId}`);
    
    // Fetch collection data
    let query = supabase
      .from('product_pages')
      .select(`
        slug,
        banner_url,
        tagline,
        logo_url,
        project:projects!inner(name)
      `)
      .eq('is_live', true)
      .eq('is_hidden', false);
    
    if (isUUID) {
      query = query.eq('project_id', slugOrId);
    } else {
      query = query.eq('slug', slugOrId);
    }
    
    const { data: collection, error } = await query.maybeSingle();

    if (error) {
      console.error('Database error:', error);
    }

    if (!collection) {
      console.log('Collection not found, returning default meta');
      // Return default AnonForge meta
      return new Response(JSON.stringify({
        title: 'AnonForge: Discover & mint unique NFTs',
        description: 'Browse curated collections from independent creators, or build and launch your own NFT project with built-in minting powered by NMKR.',
        image: 'https://anonforge.net/og-image.png',
        url: 'https://anonforge.net',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Type assertion for project - it comes back as an object from inner join
    const project = collection.project as unknown as { name: string };
    
    const title = `${project.name} | AnonForge`;
    const description = collection.tagline 
      ? `${collection.tagline} - Mint on AnonForge`
      : `Discover ${project.name} NFT collection - Mint on AnonForge`;
    const image = collection.banner_url || collection.logo_url || 'https://anonforge.net/og-image.png';
    const collectionUrl = `https://anonforge.net/collection/${collection.slug || slugOrId}`;

    console.log(`Returning OG meta for ${project.name}`);

    return new Response(JSON.stringify({
      title,
      description,
      image,
      url: collectionUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('OG Handler error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      title: 'AnonForge: Discover & mint unique NFTs',
      description: 'Browse curated collections from independent creators.',
      image: 'https://anonforge.net/og-image.png',
      url: 'https://anonforge.net',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
