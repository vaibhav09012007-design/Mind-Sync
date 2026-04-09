import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/kanban", "/calendar", "/notes", "/analytics", "/meeting", "/settings", "/api/"],
      },
    ],
    sitemap: "https://mind-sync.app/sitemap.xml",
  };
}
