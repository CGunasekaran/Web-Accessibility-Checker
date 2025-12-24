import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";

export async function POST(request: NextRequest) {
  let browser;
  try {
    const { url } = await request.json();

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-http2",
        "--disable-features=site-per-process",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    let navigationSuccess = false;
    const strategies = [
      { waitUntil: "domcontentloaded" as const, timeout: 45000 },
      { waitUntil: "load" as const, timeout: 45000 },
      { waitUntil: "networkidle0" as const, timeout: 45000 },
    ];

    for (const strategy of strategies) {
      try {
        await page.goto(url, strategy);
        navigationSuccess = true;
        await page.waitForTimeout(1500);
        break;
      } catch (navError) {
        console.log(
          `Navigation failed with ${strategy.waitUntil}, trying next strategy...`
        );
      }
    }

    if (!navigationSuccess) {
      throw new Error(
        "Unable to load the page after trying multiple strategies"
      );
    }

    const results = await new AxePuppeteer(page).analyze();

    const violations = await Promise.all(
      results.violations.map(async (violation) => {
        const nodesWithScreenshots = await Promise.all(
          violation.nodes.map(async (node) => {
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

    const errorMessage =
      error instanceof Error ? error.message : "Failed to analyze URL";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
