import express from "express";
import dotenv from "dotenv";
import crypto from "crypto";
import { chromium } from "playwright";

import { verifyApiKey } from "./auth.js";
import { createSteelSession } from "./steel.js";
import { applyLinkedInEasyApply } from "./linkedin.js";
import { sendWebhook } from "./webhook.js";
import { runJob } from "./queue.js";

dotenv.config();

const app = express();
app.use(express.json());

app.post("/start-automation", verifyApiKey, async (req, res) => {
  const jobId = crypto.randomUUID();

  const { user_id, job_preferences } = req.body;

  // Immediate response to Lovable
  res.json({ job_id: jobId, status: "queued" });

  runJob(async () => {
    let browser;

    try {
      // Notify job started
      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "application_started"
      });

      // Create Steel browser session
      const session = await createSteelSession();

      browser = await chromium.connectOverCDP(session.cdpUrl);
      const page = await browser.newPage();

      // Run LinkedIn Easy Apply automation
      await applyLinkedInEasyApply(page, job_preferences);

      // Take screenshot proof
      const screenshot = await page.screenshot({ encoding: "base64" });

      // Notify application submitted
      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "application_submitted",
        data: {
          job_title: job_preferences.job_titles[0],
          company_name: "LinkedIn",
          screenshot_base64: screenshot
        }
      });

    } catch (err) {
      console.error("Automation error:", err);

      // Notify failure
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
        await browser.close();
      }

      // Always notify completion
      await sendWebhook({
        user_id,
        job_id: jobId,
        event: "job_complete"
      });
    }
  });
});

app.listen(process.env.PORT, () => {
  console.log("Automation backend running");
});
