import axios from "axios";

export async function sendWebhook(payload) {
  await axios.post(
    process.env.LOVABLE_WEBHOOK_URL,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
}
