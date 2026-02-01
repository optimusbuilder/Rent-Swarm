
import { NextRequest } from 'next/server';
import { Browserbase } from '@browserbasehq/sdk';
import puppeteer from 'puppeteer-core';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize SDKs
const browserbase = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  const { city, price, beds } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        // 1. Create Browserbase Session
        const session = await browserbase.sessions.create({
          projectId: process.env.BROWSERBASE_PROJECT_ID!,
          keepAlive: false,
          timeout: 300,
          browserSettings: {
            viewport: { width: 1920, height: 1080 },
            solveCaptchas: true,
          }
        });

        // Get the Live View URL (public debug URL)
        const liveUrls = await browserbase.sessions.debug(session.id);
        const liveUrl = liveUrls.debuggerFullscreenUrl;

        send({ type: 'init', sessionId: session.id, liveUrl: liveUrl });

        // 2. Connect Puppeteer
        const browser = await puppeteer.connect({
          browserWSEndpoint: session.connectUrl,
        });

        const page = await browser.newPage();

        send({ type: 'log', message: 'Connected to browser...' });

        // 3. Simple Scouting Logic using Gemini to "Reason" 
        // For this demo, we'll script a simple Zillow/Craigslist flow or use Gemini to decide.
        // To keep it robust, let's just go to a site and search.

        const prompt = `
          You are a housing scout. Only output a valid JSON object with the following fields:
          - "searchUrl": A search URL for Craigslist for 2 bedroom apartments in ${city} under $${price}.
          - "platform": "Craigslist"
        `;

        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash",
          generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        // Clean markdown code blocks if any
        const jsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        let plan;
        try {
          plan = JSON.parse(jsonText);
        } catch (e) {
          // Fallback
          plan = { searchUrl: `https://sfbay.craigslist.org/search/apa?min_price=&max_price=${price}&query=${city}`, platform: 'Craigslist' };
        }

        send({ type: 'log', message: `Strategy: Searching on ${plan.platform} for ${city}...` });

        await page.goto(plan.searchUrl);

        // Wait a bit to let the user see the results loading. 
        // Increased wait time to allow Browserbase captcha solver to kick in if possible.
        await new Promise(r => setTimeout(r, 8000));

        // Attempt to hide the "Press & Hold" overlay if it exists (Cleanup for screenshot)
        try {
          await page.evaluate(() => {
            const frames = Array.from(document.querySelectorAll('iframe'));
            frames.forEach(frame => {
              // Brute force: hide strict overlays or iframes that might be captchas
              // This is a heuristic.
              const rect = frame.getBoundingClientRect();
              if (rect.width < 500 && rect.height < 500 && rect.top < 300) {
                // Likely a captcha interaction box
                // frame.style.opacity = '0'; 
              }
            });

            // Text based removal
            const elements = Array.from(document.querySelectorAll('div, section, aside'));
            elements.forEach(el => {
              if (el.shadowRoot) return;
              const htmlEl = el as HTMLElement;
              if (htmlEl.innerText && htmlEl.innerText.includes('Press & Hold')) {
                htmlEl.style.display = 'none';
              }
            });
          });
        } catch (e) {
          // Ignore
        }

        // Take initial screenshot
        try {
          const screenshot = await page.screenshot({ encoding: 'base64' });
          send({ type: 'screenshot', data: screenshot });
        } catch (e) {
          console.error("Screenshot failed", e);
        }

        // maybe take a screenshot or extract data
        const title = await page.title();
        send({ type: 'log', message: `Page Loaded: ${title}` });

        // "Analyze" the page
        send({ type: 'log', message: 'Analyzing listings...' });

        // Scroll down a bit to show activity
        await page.evaluate(() => {
          window.scrollBy(0, 1000);
        });
        await new Promise(r => setTimeout(r, 2000));

        // Take post-scroll screenshot
        try {
          // Hide overlays again just in case
          await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('div'));
            elements.forEach(el => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.innerText && htmlEl.innerText.includes('Press & Hold')) htmlEl.style.display = 'none';
            });
          });
          const screenshot = await page.screenshot({ encoding: 'base64' });
          send({ type: 'screenshot', data: screenshot });
        } catch (e) {
          console.error("Screenshot failed", e);
        }

        // Extract content for Gemini to parse
        /* 
           We switch to DOM-based extraction to get links and images reliably from Craigslist.
           This is more robust than just dumping text.
        */
        send({ type: 'log', message: `Current URL: ${page.url()}` });

        // Wait for results to load
        try {
          await page.waitForSelector('.result-row, .cl-search-result', { timeout: 5000 });
        } catch (e) {
          send({ type: 'log', message: 'Timeout waiting for selectors. Page might be empty.' });
        }

        const rawListings = await page.evaluate(() => {
          // Try multiple selector patterns for Craigslist
          let items = Array.from(document.querySelectorAll('.result-row')); // Classic view
          if (items.length === 0) {
            items = Array.from(document.querySelectorAll('.cl-search-result')); // New view
          }
          if (items.length === 0) {
            items = Array.from(document.querySelectorAll('li.cl-static-search-result')); // Static view
          }

          console.log(`Found ${items.length} raw items`);

          return items.slice(0, 25).map(item => {
            // Try identifying price and title with broad selectors if specific classes fail
            const titleEl = item.querySelector('.result-title, .titlestring, .posting-title, h3, a.cl-app-anchor');
            const priceEl = item.querySelector('.result-price, .priceinfo, .price');
            const linkEl = item.querySelector('a') as HTMLAnchorElement;

            return {
              title: (titleEl as HTMLElement)?.innerText || 'Unknown Title',
              price: (priceEl as HTMLElement)?.innerText || '$0',
              link: linkEl?.href || window.location.href, // Fallback to current page
              image: '',
              rawText: (item as HTMLElement).innerText
            };
          });
        });

        send({ type: 'log', message: `Extracted ${rawListings.length} raw items from DOM.` });
        if (rawListings.length === 0) {
          const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
          send({ type: 'log', message: `Page Dump: ${bodyText}` });
        }

        send({ type: 'log', message: 'Extracting listing data...' });

        const extractionPrompt = `
          I have extracted raw data from Craigslist. Please enrich it and return a valid JSON array.
          
          For each item in the "Raw Items" list, create an object with:
          - "id": number (incrementing)
          - "price": number (clean integer from the price string)
          - "address": string (Use the title or extract address from rawText)
          - "city": string (inferred from context or rawText)
          - "beds": number (extract from rawText e.g. "2br")
          - "baths": number (default to 1 if missing)
          - "sqft": number (extract from rawText if available)
          - "link": string (USE THE EXACT LINK PROVIDED)
          - "image": string | null (Return null for now)
          - "verified": boolean (true if price looks reasonable for the area, false if too good to be true)
          - "scamScore": number (0-100. High score if price is very low, description has caps, etc.)

          Raw Items:
          ${JSON.stringify(rawListings, null, 2)}
        `;

        const extractionResult = await model.generateContent(extractionPrompt);
        const extractionText = extractionResult.response.text();
        const cleanJson = extractionText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
          const listings = JSON.parse(cleanJson);
          send({ type: 'log', message: `Found ${listings.length} listings!` });
          send({ type: 'listings', data: listings });
        } catch (e) {
          console.error("JSON Parse Error:", e);
          console.log("Failed JSON:", cleanJson);
          send({ type: 'error', message: 'Failed to parse AI response. Using raw data.' });

          // Fallback: Use raw data if AI fails
          const fallbackListings = rawListings.map((item, i) => ({
            id: i,
            price: parseInt(item.price.replace(/[^0-9]/g, '')) || 0,
            address: item.title,
            city: "San Francisco, CA", // Default
            beds: 1, // Default
            baths: 1,
            sqft: 0,
            link: item.link,
            image: item.image,
            verified: false,
            scamScore: 0
          }));

          if (fallbackListings.length > 0) {
            send({ type: 'listings', data: fallbackListings });
          } else {
            send({ type: 'log', message: `Raw text received: ${cleanJson.slice(0, 100)}...` });
          }
        }


        // Disconnect from the browser but keep the session running for the Live View
        await browser.disconnect();
        send({ type: 'complete', message: 'Scouting complete.' });
        controller.close();

      } catch (error: any) {
        send({ type: 'error', message: error.message });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
