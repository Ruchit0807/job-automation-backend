import axios from "axios";

export async function createBrowserbaseSession() {
  const res = await axios.post(
    process.env.BROWSERBASE_API_URL,
    {
      browser: "chromium",
      region: "us"
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.BROWSERBASE_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return res.data; // contains id + connectUrl
}

