import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle2" });

    const screenshot = await page.screenshot({
      encoding: "base64",
      fullPage: true,
    });
    await browser.close();

    return NextResponse.json({
      screenshot: `data:image/png;base64,${screenshot}`,
    });
  } catch (error) {
    console.error("Screenshot error:", error);
    return NextResponse.json(
      { error: "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
