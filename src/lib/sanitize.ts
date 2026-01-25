/**
 * Input Sanitization Utilities
 * Prevents XSS and injection attacks in user inputs
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove HTML tags from a string
 */
export function stripHtml(str: string): string {
  if (!str) return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string for use in SQL-like contexts (basic)
 * 
 * @deprecated DO NOT USE THIS FUNCTION FOR SQL QUERIES!
 * This function provides minimal protection and is NOT a substitute for
 * parameterized queries. Always use Drizzle ORM's query builder which
 * automatically handles parameterization.
 * 
 * This function exists only for legacy compatibility and should be removed.
 * If you find yourself wanting to use this, you're likely doing something wrong.
 * 
 * Safe approach: Use Drizzle's eq(), and(), or() functions instead of string concatenation.
 * 
 * @see https://orm.drizzle.team/docs/operators
 */
export function sanitizeSqlString(str: string): string {
  console.warn(
    "[SECURITY WARNING] sanitizeSqlString is deprecated and provides minimal protection. " +
    "Use parameterized queries (Drizzle ORM) instead. Called with input length: " + str?.length
  );
  if (!str) return "";
  return str.replace(/['";\\]/g, "");
}

/**
 * Sanitize a URL to prevent javascript: and data: attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return "";
    }
  }

  // Allow relative URLs, http, https, mailto, tel
  const allowedProtocols = ["http://", "https://", "mailto:", "tel:", "/", "#"];
  const isAllowed = allowedProtocols.some((p) => trimmed.startsWith(p)) || !trimmed.includes(":");

  return isAllowed ? url : "";
}

/**
 * Sanitize user input for general text fields
 */
export function sanitizeText(input: string, maxLength = 1000): string {
  if (!input) return "";

  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Sanitize a task title
 */
export function sanitizeTaskTitle(title: string): string {
  return sanitizeText(stripHtml(title), 200);
}

/**
 * Sanitize a task description (allows some formatting)
 */
export function sanitizeTaskDescription(description: string): string {
  return sanitizeText(description, 5000);
}

/**
 * Sanitize note content (HTML allowed but dangerous tags removed)
 */
export function sanitizeNoteContent(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove onclick and other event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');

  // Remove iframe, embed, object tags
  sanitized = sanitized.replace(/<(iframe|embed|object|applet|form)[^>]*>.*?<\/\1>/gi, "");
  sanitized = sanitized.replace(/<(iframe|embed|object|applet|form)[^>]*\/?>/gi, "");

  return sanitized;
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => sanitizeText(stripHtml(tag), 50))
    .filter((tag) => tag.length > 0)
    .slice(0, 20); // Max 20 tags
}

/**
 * Validate and sanitize an email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(trimmed) ? trimmed : "";
}
