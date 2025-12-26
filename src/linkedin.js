export async function applyLinkedInEasyApply(page, jobPreferences) {
  const searchQuery = encodeURIComponent(jobPreferences.job_titles[0]);

  const url = `https://www.linkedin.com/jobs/search/?keywords=${searchQuery}`;

  await page.goto(url, { waitUntil: "domcontentloaded" });

  await page.waitForTimeout(5000);

  const easyApplyButtons = await page.$$('button:has-text("Easy Apply")');

  if (easyApplyButtons.length === 0) {
    throw new Error("No Easy Apply jobs found");
  }

  await easyApplyButtons[0].click();
  await page.waitForTimeout(3000);

  // MVP: just stop here after opening form
  return true;
}

