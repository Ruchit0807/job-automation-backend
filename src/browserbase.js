import axios from "axios";

export async function createBrowserbaseSession() {
  const response = await axios.post(
    "https://api.browserbase.com/v1/sessions",
    {
      browser: "chromium",
      region: "us"
    },
    {
      headers: {
        "x-api-key": process.env.BROWSERBASE_API_KEY,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;
}



