import axios from "axios";

export async function createSteelSession() {
  const res = await axios.post(
    `${process.env.STEEL_BASE_URL}/v1/sessions`,
    {
      stealth: true,
      blockAds: true
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.STEEL_API_KEY}`
      }
    }
  );

  return res.data;
}
