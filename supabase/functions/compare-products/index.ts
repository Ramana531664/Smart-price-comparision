import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductResult {
  name: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviews?: number;
  store: string;
  url: string;
  imageUrl?: string;
  delivery?: string;
  inStock: boolean;
}

interface ComparisonResult {
  products: ProductResult[];
  recommendation: {
    bestValue: ProductResult | null;
    cheapest: ProductResult | null;
    highestRated: ProductResult | null;
    reasoning: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, url } = await req.json();

    if (!query && !url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search query or URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for products using Firecrawl's search API
    const searchQueries = query 
      ? [
          `${query} site:amazon.in`,
          `${query} site:flipkart.com`,
          `${query} site:myntra.com`,
          `${query} site:ajio.com`,
          `${query} site:croma.com`,
          `${query} site:reliancedigital.in`,
        ]
      : [];

    // If URL provided, extract product info and search for it
    let productName = query;
    if (url) {
      console.log('Extracting product info from URL:', url);
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeResponse.json();
      if (scrapeResponse.ok && scrapeData.data?.metadata?.title) {
        // Clean up product title for search
        productName = scrapeData.data.metadata.title
          .replace(/Amazon\.in|Flipkart|Buy|Online|India|[:|\-]/gi, '')
          .trim()
          .split(' ')
          .slice(0, 8)
          .join(' ');
        console.log('Extracted product name:', productName);
      }
    }

    // Search across multiple sites
    const searchResults: any[] = [];
    
    for (const site of ['amazon.in', 'flipkart.com', 'myntra.com', 'ajio.com', 'croma.com']) {
      try {
        console.log(`Searching ${site} for: ${productName}`);
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `${productName} price buy site:${site}`,
            limit: 3,
            scrapeOptions: {
              formats: ['markdown'],
              includeTags: ['img'],
            },
          }),
        });

        const searchData = await searchResponse.json();
        if (searchResponse.ok && searchData.data) {
          searchResults.push(...searchData.data.map((r: any) => ({ ...r, store: site })));
        }
      } catch (e) {
        console.error(`Error searching ${site}:`, e);
      }
    }

    console.log(`Found ${searchResults.length} search results`);

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No products found. Try a different search term or product name.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to extract and analyze product information
    const aiPrompt = `Analyze these search results and extract product information. Return ONLY valid JSON.

Search query: "${productName}"

Search Results:
${searchResults.map((r, i) => `
---Result ${i + 1} from ${r.store}---
URL: ${r.url}
Title: ${r.title || 'N/A'}
Description: ${r.description || 'N/A'}
Metadata: ${JSON.stringify(r.metadata || {})}
Content: ${(r.markdown || '').slice(0, 2000)}
`).join('\n')}

Extract products and return this JSON structure:
{
  "products": [
    {
      "name": "product name",
      "price": 1999,
      "originalPrice": 2999,
      "rating": 4.5,
      "reviews": 1234,
      "store": "amazon.in",
      "url": "full url",
      "imageUrl": "https://example.com/product-image.jpg",
      "delivery": "delivery info",
      "inStock": true
    }
  ],
  "recommendation": {
    "bestValueIndex": 0,
    "cheapestIndex": 0,
    "highestRatedIndex": 0,
    "reasoning": "explanation of why this is the best deal considering price, rating, and delivery"
  }
}

Rules:
- Only include products that match the search query
- Price must be a number (no currency symbols) - REQUIRED, skip products without a valid price
- originalPrice should be the MRP or original price before discount
- Rating must be between 1-5 or null
- inStock defaults to true if not clear
- imageUrl: Extract the main product image URL from the metadata (ogImage, image) or from img tags in content. This is VERY IMPORTANT.
- If no valid products found, return empty products array
- SKIP products that don't have a valid numeric price`;

    console.log('Calling AI for analysis...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a product comparison expert. Extract and analyze product data accurately. Return only valid JSON.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse JSON from AI response
    let analysisResult;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      const jsonStr = jsonMatch[1].trim();
      analysisResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to analyze products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build final result
    const products = analysisResult.products || [];
    const rec = analysisResult.recommendation || {};

    const result: ComparisonResult = {
      products: products.map((p: any) => ({
        name: p.name,
        price: p.price,
        originalPrice: p.originalPrice,
        rating: p.rating,
        reviews: p.reviews,
        store: p.store,
        url: p.url,
        imageUrl: p.imageUrl,
        delivery: p.delivery,
        inStock: p.inStock !== false,
      })),
      recommendation: {
        bestValue: products[rec.bestValueIndex] || null,
        cheapest: products[rec.cheapestIndex] || null,
        highestRated: products[rec.highestRatedIndex] || null,
        reasoning: rec.reasoning || 'Unable to determine best recommendation.',
      },
    };

    console.log(`Returning ${result.products.length} products`);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error comparing products:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to compare products';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
