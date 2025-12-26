import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import { chromium } from "playwright";

import { verifyApiKey } from "./auth.js";
import { createBrowserbaseSession } from "./browserbase.js";
import { applyLinkedInEasyApply } from "./linkedin.js";
import { sendWebhook } from "./webhook.js";

dotenv.config();

const app = express();
app.use(express.json());

/**
 * Health check (optional but useful)
 */
app.get("/", (req, res) => {
  res.json({ status: "Automation backend running" });
});

/**
 * MAIN ENTRYPOINT CALLED BY LOVABLE
 */
app.post("/start-automation", verifyApiKey, async (req, res) => {
  console.log("✅ /start-automation HIT");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  const jobId = crypto.randomUUID();
  const { user_id, job_preferences } = req.body;

  // Immediately respond to Lovable
  res.json({ job_id: jobId, status: "queued" });

  // Run automation asynchronously
  (async () => {
    let browser;

    try {
      console.log("🚀 Automation started for job:", jobId);

      // Notify start
      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "application_started"
      });

      console.log("🌐 Creating BrowserBase session...");
      const session = await createBrowserbaseSession();
      console.log("✅ BrowserBase session created:", session.id);

      console.log("🔌 Connecting Playwright to BrowserBase...");
      browser = await chromium.connectOverCDP(session.connectUrl);

      const page = await browser.newPage();

      console.log("🧭 Running LinkedIn Easy Apply logic...");
      await applyLinkedInEasyApply(page, job_preferences);

      console.log("📸 Taking screenshot...");
      const screenshot = await page.screenshot({ encoding: "base64" });

      console.log("📡 Sending application_submitted webhook...");
      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "application_submitted",
        data: {
          job_title: job_preferences?.job_titles?.[0] || "Unknown",
          company_name: "LinkedIn",
          screenshot_base64: screenshot
        }
      });

      console.log("🏁 Automation completed successfully");

      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "job_complete"
      });

    } catch (err) {
      console.error("❌ Automation failed:", err.message);

      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "application_failed",
        data: {
          error_message: err.message
        }
      });

    } finally {
      if (browser) {
        console.log("🧹 Closing browser");
        await browser.close();
      }
    }
  })();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Automation backend running on port ${PORT}`);
});
