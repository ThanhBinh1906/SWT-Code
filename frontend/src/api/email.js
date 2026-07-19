import { api } from "./client";

export const EMAIL_DELIVERY_LOCKED = true;

export async function sendDemoEmail(payload) {
  if (EMAIL_DELIVERY_LOCKED) {
    throw new Error("Email delivery is locked in demo mode");
  }

  return api("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
