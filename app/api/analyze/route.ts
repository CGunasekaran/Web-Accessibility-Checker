import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

// Set max duration for Vercel serverless function (60s for hobby/pro tier)
export const maxDuration = 60;

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
    const isProduction =
      process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;

    let playwright;
    let chromium;

    if (isProduction) {
      // Use playwright-aws-lambda for serverless
      const playwrightLambda = await import("playwright-aws-lambda");
      chromium = playwrightLambda.default;
      browser = await chromium.launchChromium({ headless: true });
    } else {
      // Use regular playwright for local development
      const playwrightModule = await import("playwright-core");
      playwright = playwrightModule.chromium;
      browser = await playwright.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate with optimized timeout for serverless
    let navigationSuccess = false;
    let lastError: Error | null = null;

    // Faster strategies for serverless
    const strategies = [
      { waitUntil: "domcontentloaded" as const, timeout: 15000 },
      { waitUntil: "networkidle" as const, timeout: 20000 },
      { waitUntil: "load" as const, timeout: 10000 },
    ];

    for (const strategy of strategies) {
      try {
        console.log(`Trying navigation with ${strategy.waitUntil}...`);
        await page.goto(url, {
          waitUntil: strategy.waitUntil,
          timeout: strategy.timeout,
        });
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

    // Brief wait for page to stabilize
    await new Promise((resolve) => setTimeout(resolve, 1000));

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
          iframes: false,
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
              const element = await page.locator(selector).first();
              let screenshot = null;

              if (element) {
                const screenshotBuffer = await element.screenshot();
                screenshot = screenshotBuffer.toString("base64");
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
