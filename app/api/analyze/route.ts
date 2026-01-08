import { NextRequest, NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import * as path from "path";

// Set max duration for Vercel serverless function (10s for Hobby tier)
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

    // Fetch the HTML content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    if (!html || html.length === 0) {
      throw new Error("Page has no content");
    }

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
