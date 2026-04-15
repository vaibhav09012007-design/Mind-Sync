/**
 * Email client wrapper
 * Uses Resend API in production, console.log in development
 */

import { logger } from "@/lib/logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send an email using Resend API (production) or log to console (dev)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    // Dev fallback — log to console
    logger.info("📧 Email (dev mode - not sent)", {
      action: "sendEmail",
      to: options.to,
      subject: options.subject,
    });
    console.log("─── EMAIL PREVIEW ───");
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`From: ${options.from ?? "Mind-Sync <noreply@mindsync.app>"}`);
    console.log("─── HTML BODY ───");
    console.log(options.html.slice(0, 500) + "...");
    console.log("─── END EMAIL ───");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: options.from ?? "Mind-Sync <noreply@mindsync.app>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("Resend API error", new Error(error), {
        action: "sendEmail",
        status: response.status,
      });
      return false;
    }

    logger.info("Email sent", {
      action: "sendEmail",
      to: options.to,
      subject: options.subject,
    });
    return true;
  } catch (error) {
    logger.error("Email send failed", error as Error, { action: "sendEmail" });
    return false;
  }
}
