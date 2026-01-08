import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { url } = await request.json();

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid URL provided" },
        { status: 400 }
      );
    }

    // Determine if running locally or in production
    const isProduction = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    let launchOptions;
    
    if (isProduction) {
      // Configure chromium for serverless
      chromium.setGraphicsMode = false;
      
      launchOptions = {
        args: [...chromium.args, "--disable-http2"],
        executablePath: await chromium.executablePath(),
        headless: true,
      };
    } else {
      // Local development
      launchOptions = {
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-http2",
        ],
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "/usr/bin/google-chrome",
        headless: true,
      };
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Set a realistic user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Try multiple navigation strategies
    let navigationSuccess = false;
    let lastError: Error | null = null;

    const strategies = [
      { waitUntil: "domcontentloaded" as const, timeout: 25000 },
      { waitUntil: "load" as const, timeout: 25000 },
      { waitUntil: "networkidle0" as const, timeout: 25000 },
      { waitUntil: "networkidle2" as const, timeout: 25000 },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`Trying navigation with ${strategy.waitUntil}...`);
        await page.goto(url, strategy);
        navigationSuccess = true;
        console.log(`Successfully loaded with ${strategy.waitUntil}`);
        break;
      } catch (navError) {
        lastError = navError as Error;
        console.log(`Failed with ${strategy.waitUntil}: ${lastError.message}`);
        continue;
      }
    }

    if (!navigationSuccess) {
      throw new Error(
        `Failed to load URL after trying multiple strategies. Last error: ${lastError?.message}`
      );
    }

    // Wait for page to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Check if page has content
    const hasContent = await page.evaluate(
      () => document.body.innerHTML.length > 0
    );
    if (!hasContent) {
      throw new Error("Page loaded but has no content");
    }

    // Load axe-core from node_modules
    const axePath = path.join(
      process.cwd(),
      "node_modules",
      "axe-core",
      "axe.min.js"
    );
    const axeSource = fs.readFileSync(axePath, "utf8");

    // Inject and run axe-core
    await page.evaluate(axeSource);

    // Verify axe is loaded
    const axeLoaded = await page.evaluate(
      () => typeof (window as any).axe !== "undefined"
    );
    if (!axeLoaded) {
      throw new Error("Failed to load axe-core library");
    }

    // Run axe with iframe support disabled and error handling
    const results = await page.evaluate(async () => {
      try {
        return await (window as any).axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
          },
          iframes: false, // Disable iframe scanning
          resultTypes: ["violations", "passes", "incomplete"],
        });
      } catch (error) {
        console.error("Axe run error:", error);
        throw error;
      }
    });

    const violations = await Promise.all(
      results.violations.map(async (violation: any) => {
        const nodesWithScreenshots = await Promise.all(
          violation.nodes.map(async (node: any) => {
            try {
              const selector =
                typeof node.target[0] === "string"
                  ? node.target[0]
                  : String(node.target[0]);
              const element = await page.$(selector);
              let screenshot = null;

              if (element) {
                screenshot = await element.screenshot({ encoding: "base64" });
              }

              return {
                ...node,
                screenshot: screenshot
                  ? `data:image/png;base64,${screenshot}`
                  : null,
              };
            } catch (error) {
              return { ...node, screenshot: null };
            }
          })
        );

        return {
          ...violation,
          nodes: nodesWithScreenshots,
        };
      })
    );

    if (browser) {
      await browser.close();
    }

    return NextResponse.json({
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      url: results.url,
      timestamp: results.timestamp,
    });
  } catch (error) {
    console.error("Analysis error:", error);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    // Provide detailed error message
    let errorMessage = "Failed to analyze URL";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if (error.message.includes("net::ERR_")) {
        errorDetails =
          "Network error occurred. The website may be blocking automated access or using protocols that are not supported.";
      } else if (error.message.includes("timeout")) {
        errorDetails =
          "The page took too long to load. Try again or check if the URL is accessible.";
      } else if (error.message.includes("no content")) {
        errorDetails = "The page loaded but appears to be empty.";
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
