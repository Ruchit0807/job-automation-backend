const { user_id } = req.body;
import express from "express";
import dotenv from "dotenv";
import { verifyApiKey } from "./auth.js";
import { createSteelSession } from "./steel.js";
import { applyLinkedInEasyApply } from "./linkedin.js";
import { sendWebhook } from "./webhook.js";
import { runJob } from "./queue.js";
import { chromium } from "playwright";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/start-automation", verifyApiKey, async (req, res) => {
  const jobId = crypto.randomUUID();
  res.json({ job_id: jobId, status: "queued" });

  runJob(async () => {
    try {
      const session = await createSteelSession();

      const browser = await chromium.connectOverCDP(
        session.cdpUrl
      );

      const page = await browser.newPage();

      await applyLinkedInEasyApply(page, req.body.job_preferences);

      const screenshot = await page.screenshot({ encoding: "base64" });

      await sendWebhook({
        job_id: jobId,
        event: "application_submitted",
        data: {
          job_title: req.body.job_preferences.job_titles[0],
          company_name: "LinkedIn Job",
          screenshot_base64: screenshot
        }
      });

      await browser.close();

      await sendWebhook({
        job_id: jobId,
        event: "job_complete"
      });
    } catch (err) {
      await sendWebhook({
        job_id: jobId,
        event: "application_failed",
        data: { error_message: err.message }
      });
    }
  });
});

app.listen(process.env.PORT, () =>
  console.log("Automation backend running")
);

