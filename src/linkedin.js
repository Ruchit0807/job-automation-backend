export async function applyLinkedInEasyApply(page, user) {
  await page.goto("https://www.linkedin.com/jobs", { timeout: 60000 });

  await page.fill("input[aria-label='Search by title']", user.job_titles[0]);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);

  const jobs = await page.$$("button.jobs-apply-button");

  for (let job of jobs.slice(0, user.limit)) {
    await job.click();
    await page.waitForTimeout(2000);

    const easyApply = await page.$("button[aria-label*='Easy Apply']");
    if (!easyApply) continue;

    await easyApply.click();
    await page.waitForTimeout(2000);

    // Submit (basic flow)
    const submit = await page.$("button[aria-label='Submit application']");
    if (submit) {
      await submit.click();
      await page.waitForTimeout(2000);
    }
  }
}
