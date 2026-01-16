const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const { url } = JSON.parse(event.body);
    if (!url || typeof url !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid URL provided" }),
      };
    }

    // Keep under the Netlify function hard timeout (~10s on free tier)
    const timeout = 9500;
    let response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
        signal: AbortSignal.timeout(timeout),
      });
    } catch (fetchError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            "Website timeout. This site loads too slowly for the current hosting timeout.",
        }),
      };
    }

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: `Failed to fetch URL: ${response.statusText}`,
        }),
      };
    }

    const html = await response.text();
    if (!html || html.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Page has no content" }),
      };
    }

    // Load axe-core from local lib directory
    let axeSource;
    try {
      const axePath = path.join(process.cwd(), "lib", "axe.min.js");
      axeSource = fs.readFileSync(axePath, "utf8");
    } catch (readError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            "axe-core could not be loaded from lib/axe.min.js. Ensure the file exists and is accessible.",
        }),
      };
    }

    // Create a DOM using JSDOM. Avoid loading external subresources (CSS/JS/images),
    // which can easily exceed serverless time limits.
    const dom = new JSDOM(html, {
      url: url,
      runScripts: "outside-only",
    });
    const { window } = dom;

    // Inject axe-core into the window
    try {
      const script = new window.Function(axeSource);
      script.call(window);
    } catch (injectError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to inject axe-core into JSDOM window.",
        }),
      };
    }

    // Verify axe is loaded
    if (typeof window.axe === "undefined") {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to load axe-core library" }),
      };
    }

    // Run axe analysis
    const results = await window.axe.run(window.document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
      },
      resultTypes: ["violations", "passes", "incomplete"],
    });

    // Process violations
    const violations = results.violations.map((violation) => ({
      ...violation,
      nodes: violation.nodes.map((node) => ({
        ...node,
        screenshot: null,
      })),
    }));

    window.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        violations,
        passes: results.passes.length,
        incomplete: results.incomplete.length,
        url: results.url || url,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Unknown error" }),
    };
  }
};
