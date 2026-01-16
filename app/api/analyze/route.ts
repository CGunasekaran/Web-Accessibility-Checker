import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Set max duration for Vercel serverless function (10s for free Hobby tier)
export const maxDuration = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeFetchError(err: unknown) {
  const anyErr = err as any;
  const name = anyErr?.name;
  const message = anyErr?.message;
  const code = anyErr?.code;
  const cause = anyErr?.cause;
  const causeCode = cause?.code;
  const causeMessage = cause?.message;

  return {
    name,
    message,
    code,
    causeCode,
    causeMessage,
  };
}

async function fetchHtmlWithFallback(options: {
  originalUrl: string;
  normalizedUrl: string;
  timeoutMs: number;
  allowHttpFallback: boolean;
}) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
  };

  const attemptUrls = [options.normalizedUrl];

  // If the user didn't specify a scheme, some sites only respond over http.
  if (options.allowHttpFallback && options.normalizedUrl.startsWith("https://")) {
    attemptUrls.push(`http://${options.normalizedUrl.slice("https://".length)}`);
  }

  let lastError: unknown;

  for (const attemptUrl of attemptUrls) {
    // 2 attempts per URL for transient network failures
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await fetch(attemptUrl, {
          headers,
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(options.timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        if (!html || html.length === 0) {
          throw new Error("Page has no content");
        }

        return { html, finalUrl: attemptUrl };
      } catch (err) {
        lastError = err;

        // If we timed out, don't bother retrying other URLs for long.
        const anyErr = err as any;
        if (anyErr?.name === "TimeoutError" || anyErr?.code === 23) {
          throw err;
        }

        // small backoff before retry
        if (attempt === 1) {
          await sleep(300);
        }
      }
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Normalize URL (allow users to enter without protocol)
    const userProvidedScheme =
      url.startsWith("http://") || url.startsWith("https://");

    const normalizedUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;

    // Ensure URL is syntactically valid
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    console.log(`Fetching URL: ${normalizedUrl}`);

    // Detect platform - Railway has longer timeouts
    const isRailway =
      process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

    // Allow overriding via env var (useful for Railway)
    const timeoutOverride = Number(process.env.FETCH_TIMEOUT_MS);
    const timeout = Number.isFinite(timeoutOverride)
      ? timeoutOverride
      : isRailway
      ? 90000
      : 7000; // 90s on Railway by default, 7s on Vercel

    console.log(
      `Platform: ${isRailway ? "Railway" : "Vercel"}, Timeout: ${timeout}ms`
    );

    // Fetch the HTML content (with retry + http fallback when user omitted scheme)
    let html: string;
    try {
      const result = await fetchHtmlWithFallback({
        originalUrl: url,
        normalizedUrl,
        timeoutMs: timeout,
        allowHttpFallback: !userProvidedScheme,
      });
      html = result.html;
    } catch (fetchError: any) {
      if (fetchError.name === "TimeoutError" || fetchError.code === 23) {
        const message = isRailway
          ? "Website timeout. This site is extremely slow/unresponsive, or blocking server-side requests. Try a different page or set FETCH_TIMEOUT_MS on Railway to increase the limit."
          : "Website timeout (7s limit). This site loads too slowly for free Vercel hosting. The app is also deployed on Railway with longer timeouts - check your Railway URL.";
        throw new Error(message);
      }

      // Improve actionable diagnostics for undici/node fetch() failures
      const info = describeFetchError(fetchError);
      console.error("Fetch failed diagnostics:", info);

      throw fetchError;
    }

    // Dynamically import JSDOM to avoid ESM/CommonJS conflicts
    const { JSDOM } = await import("jsdom");

    // Create a DOM using JSDOM. Avoid loading external subresources (CSS/JS/images)
    // to keep server-side analysis fast and stable.
    const dom = new JSDOM(html, {
      url: url,
      runScripts: "outside-only",
    });

    const { window } = dom;

    // Load axe-core from local lib directory for serverless compatibility
    let axeSource;
    try {
      const axePath = path.join(process.cwd(), "lib", "axe.min.js");
      axeSource = fs.readFileSync(axePath, "utf8");
    } catch (readError) {
      console.error("Failed to read axe.min.js from lib directory:", readError);
      throw new Error(
        "axe-core could not be loaded from lib/axe.min.js. Ensure the file exists and is accessible."
      );
    }

    // Inject axe-core into the window
    try {
      const script = new window.Function(axeSource);
      script.call(window);
    } catch (injectError) {
      console.error("Failed to inject axe-core:", injectError);
      throw new Error("Failed to inject axe-core into JSDOM window.");
    }

    // Verify axe is loaded
    if (typeof (window as any).axe === "undefined") {
      throw new Error("Failed to load axe-core library");
    }

    console.log("Running axe-core analysis...");

    // Run axe analysis
    const results = await (window as any).axe.run(window.document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
      resultTypes: ["violations", "passes", "incomplete"],
    });

    // Process violations (note: no screenshots in JSDOM mode)
    const violations = results.violations.map((violation: any) => ({
      ...violation,
      nodes: violation.nodes.map((node: any) => ({
        ...node,
        screenshot: null, // Screenshots not available in JSDOM mode
      })),
    }));

    console.log(`Analysis complete. Found ${violations.length} violations`);

    // Cleanup
    window.close();

    return NextResponse.json({
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      url: results.url || url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);

    // Provide detailed error message
    let errorMessage = "Failed to analyze URL";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if (error.message.includes("fetch") || error.message.includes("Fetch failed")) {
        errorDetails =
          "Network error occurred. The website may be blocking automated access, rejecting Railway IPs, or failing TLS/DNS. Try another page on the same site, or test with a simple URL like https://example.com to confirm the service is working.";
      } else if (error.message.includes("timeout")) {
        errorDetails =
          "The request took too long. Try again or check if the URL is accessible.";
      } else if (error.message.includes("no content")) {
        errorDetails = "The page appears to be empty.";
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
