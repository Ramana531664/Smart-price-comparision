import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      console.error('Product not found:', productError);
      return new Response(
        JSON.stringify({ success: false, error: 'Product not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape latest price
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Scraping service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Refreshing price for:', product.url);

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: product.url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape page' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract price - handle multiple currency formats
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const html = scrapeData.data?.html || scrapeData.html || '';
    const textContent = markdown + ' ' + html;
    
    // Price patterns for multiple currencies
    const patterns = [
      /(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d{2})?)/i,
      /\$\s*([\d,]+(?:\.\d{2})?)/,
      /€\s*([\d,]+(?:\.\d{2})?)/,
      /£\s*([\d,]+(?:\.\d{2})?)/,
    ];
    
    let newPrice: number | null = null;
    for (const pattern of patterns) {
      const match = textContent.match(pattern);
      if (match) {
        const priceStr = match[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0) {
          newPrice = price;
          break;
        }
      }
    }

    if (newPrice === null) {
      console.log('Could not extract price from page');
      return new Response(
        JSON.stringify({ success: false, error: 'Could not find price on page' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update product
    const { error: updateError } = await supabase
      .from('products')
      .update({
        current_price: newPrice,
        last_checked_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update product' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record in price history if price changed
    if (newPrice !== product.current_price) {
      const { error: historyError } = await supabase
        .from('price_history')
        .insert({
          product_id: productId,
          price: newPrice,
        });

      if (historyError) {
        console.error('History insert error:', historyError);
      }
    }

    console.log('Price updated:', { old: product.current_price, new: newPrice });

    return new Response(
      JSON.stringify({ 
        success: true, 
        oldPrice: product.current_price,
        newPrice,
        changed: newPrice !== product.current_price,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error refreshing price:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh price';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
