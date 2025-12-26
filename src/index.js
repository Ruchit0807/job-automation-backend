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

app.post("/start-automation", verifyApiKey, async (req, res) => {
  const jobId = crypto.randomUUID();
  const { user_id, job_preferences } = req.body;

  // Respond immediately
  res.json({ job_id: jobId, status: "queued" });

  try {
    await sendWebhook({
      user_id,
      job_id: jobId,
      event: "application_started"
    });

    const session = await createBrowserbaseSession();

    const browser = await chromium.connectOverCDP(
      session.connectUrl
    );

    const page = await browser.newPage();

    await applyLinkedInEasyApply(page, job_preferences);

    const screenshot = await page.screenshot({ encoding: "base64" });

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

    await browser.close();

    await sendWebhook({
      user_id,
      job_id: jobId,
      event: "job_complete"
    });

  } catch (err) {
    await sendWebhook({
      user_id,
      job_id: jobId,
      event: "application_failed",
      data: { error_message: err.message }
    });
  }
});

app.listen(process.env.PORT, () =>
  console.log("Automation backend running")
);
