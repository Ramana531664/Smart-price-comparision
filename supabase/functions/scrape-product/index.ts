const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract price from text - handles multiple currencies and formats
function extractPrice(text: string): number | null {
  // Common price patterns for various currencies
  const patterns = [
    // Indian Rupee: ₹1,234.56 or Rs. 1234 or INR 1234
    /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/gi,
    // US Dollar: $1,234.56
    /\$\s*([\d,]+(?:\.\d{2})?)/g,
    // Euro: €1,234.56 or 1234,56€
    /€\s*([\d,]+(?:\.\d{2})?)/g,
    // British Pound: £1,234.56
    /£\s*([\d,]+(?:\.\d{2})?)/g,
    // Generic number with currency symbol nearby
    /(?:price|cost|mrp|sale)[\s:]*(?:₹|\$|€|£|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)/gi,
  ];

  const prices: number[] = [];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0 && price < 10000000) {
        prices.push(price);
      }
    }
  }

  // Return the most likely price (often the first reasonable one)
  if (prices.length > 0) {
    // Filter out very small numbers that might be percentages
    const validPrices = prices.filter(p => p > 1);
    return validPrices.length > 0 ? validPrices[0] : prices[0];
  }

  return null;
}

// Extract original price (usually crossed out/strikethrough price)
function extractOriginalPrice(text: string): number | null {
  const patterns = [
    // M.R.P or MRP patterns common on Indian sites
    /(?:M\.?R\.?P\.?|Original|Was|List\s*Price)[\s:]*(?:₹|\$|€|£|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)/gi,
    // Strikethrough patterns in markdown
    /~~(?:₹|\$|€|£|Rs\.?)?\s*([\d,]+(?:\.\d{2})?)~~/g,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping product URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || 'Failed to scrape page' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract product info from scraped content
    const markdown = data.data?.markdown || data.markdown || '';
    const html = data.data?.html || data.html || '';
    const metadata = data.data?.metadata || data.metadata || {};
    
    // Combine sources for price extraction
    const textContent = markdown + ' ' + html;
    
    // Extract current price and original price
    const currentPrice = extractPrice(textContent);
    const originalPrice = extractOriginalPrice(textContent) || currentPrice;
    
    console.log('Extracted prices:', { currentPrice, originalPrice });
    
    // Try to extract image
    const ogImage = metadata.ogImage || metadata.image || null;
    
    // Extract store from URL
    const urlObj = new URL(formattedUrl);
    const store = urlObj.hostname.replace('www.', '').split('.')[0];
    const storeName = store.charAt(0).toUpperCase() + store.slice(1);

    const result = {
      success: true,
      name: metadata.title || metadata.ogTitle || 'Unknown Product',
      price: currentPrice,
      original_price: originalPrice,
      image_url: ogImage,
      store: storeName,
      description: metadata.description || metadata.ogDescription || null,
    };

    console.log('Scraped product:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape product';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
