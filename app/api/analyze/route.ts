import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Set max duration for Vercel serverless function (10s for free Hobby tier)
export const maxDuration = 10;

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

    console.log(`Fetching URL: ${url}`);

    // Fetch the HTML content with retry logic for slow sites
    let response;
    let lastError;
    const maxRetries = 2;
    const timeout = 8000; // 8 seconds to fit within 10s limit

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries}...`);
        response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(timeout),
        });
        break; // Success, exit retry loop
      } catch (fetchError: any) {
        lastError = fetchError;
        console.log(`Attempt ${attempt} failed: ${fetchError.message}`);
        
        if (attempt === maxRetries) {
          // Last attempt failed
          if (fetchError.name === "TimeoutError" || fetchError.code === 23) {
            throw new Error(
              "Site timeout: This website is too slow for the free tier (10s limit). Try: 1) A faster/lighter page from the same site, 2) Test a different website, or 3) The site may be temporarily slow - try again later."
            );
          }
          throw fetchError;
        }
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (!response) {
      throw lastError || new Error("Failed to fetch URL");
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    if (!html || html.length === 0) {
      throw new Error("Page has no content");
    }

    // Dynamically import JSDOM to avoid ESM/CommonJS conflicts
    const { JSDOM } = await import("jsdom");

    // Create a DOM using JSDOM
    const dom = new JSDOM(html, {
      url: url,
      runScripts: "outside-only",
      resources: "usable",
    });

    const { window } = dom;

    // Load axe-core from node_modules
    const axePath = path.join(
      process.cwd(),
      "node_modules",
      "axe-core",
      "axe.min.js"
    );
    const axeSource = fs.readFileSync(axePath, "utf8");

    // Inject axe-core into the window
    const script = new window.Function(axeSource);
    script.call(window);

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
      if (error.message.includes("fetch")) {
        errorDetails =
          "Network error occurred. The website may be blocking automated access or is not accessible.";
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
