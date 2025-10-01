import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExtractRequest {
  url: string;
}

interface Recipe {
  name: string;
  serving_size?: string;
  ingredients: string[];
  instructions: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { url }: ExtractRequest = await req.json();

    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const getText = (selector: string): string | null => {
      const element = doc.querySelector(selector);
      return element?.textContent?.trim() || null;
    };

    const getMultiple = (selector: string): string[] => {
      const elements = doc.querySelectorAll(selector);
      return Array.from(elements)
        .map(el => el.textContent?.trim())
        .filter((text): text is string => !!text);
    };

    let recipe: Partial<Recipe> = {};

    recipe.name = getText('h1') || 
                  getText('[class*="recipe-title"]') || 
                  getText('[class*="title"]') || 
                  'Untitled Recipe';

    const ingredientSelectors = [
      '[class*="ingredient"] li',
      '[class*="ingredients"] li',
      '.ingredient',
      '[itemprop="recipeIngredient"]',
    ];

    for (const selector of ingredientSelectors) {
      const ingredients = getMultiple(selector);
      if (ingredients.length > 0) {
        recipe.ingredients = ingredients;
        break;
      }
    }

    const instructionSelectors = [
      '[class*="instruction"] li',
      '[class*="instructions"] li',
      '[class*="direction"] li',
      '[class*="step"]',
      '[itemprop="recipeInstructions"] li',
      'ol li',
    ];

    for (const selector of instructionSelectors) {
      const instructions = getMultiple(selector);
      if (instructions.length > 0) {
        recipe.instructions = instructions;
        break;
      }
    }

    const servingText = getText('[itemprop="recipeYield"]') ||
                       getText('[class*="yield"]') ||
                       getText('[class*="serving"]');
    if (servingText) {
      recipe.serving_size = servingText;
    }

    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract recipe data from URL',
          partial: recipe 
        }),
        {
          status: 422,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify(recipe),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error extracting recipe:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract recipe',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});