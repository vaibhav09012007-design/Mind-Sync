/**
 * Test helpers — exports internal functions for unit testing
 * This avoids needing to mock the entire server action chain
 */

// Re-export the local categorization logic for direct testing
// These patterns are the same as in ai-categorize.ts

const PRIORITY_PATTERNS: [RegExp, "P0" | "P1" | "P2" | "P3"][] = [
  [/\b(critical|urgent|asap|emergency|prod\s*bug|hotfix|p0|blocker)\b/i, "P0"],
  [/\b(important|high|priority|deadline|review|ship)\b/i, "P1"],
  [/\b(low|minor|nice.?to.?have|someday|backlog|cleanup)\b/i, "P3"],
];

const TAG_PATTERNS: [RegExp, string][] = [
  [/\b(bug|fix|error|crash|broken|issue)\b/i, "bug"],
  [/\b(feature|add|implement|build|create|new)\b/i, "feature"],
  [/\b(docs?|document|readme|write.?up)\b/i, "docs"],
  [/\b(test|spec|coverage|e2e|unit)\b/i, "testing"],
  [/\b(design|ui|ux|layout|style|css)\b/i, "design"],
  [/\b(deploy|release|ci|cd|pipeline|infra)\b/i, "devops"],
  [/\b(refactor|clean|improve|optimize|perf)\b/i, "refactor"],
  [/\b(meeting|call|sync|standup|review)\b/i, "meeting"],
  [/\b(research|spike|explore|investigate|poc)\b/i, "research"],
];

const ESTIMATE_PATTERNS: [RegExp, number][] = [
  [/\b(quick|small|minor|typo|tweak)\b/i, 15],
  [/\b(bug|fix|update|change)\b/i, 30],
  [/\b(feature|implement|build|add)\b/i, 120],
  [/\b(refactor|redesign|migrate|overhaul)\b/i, 240],
  [/\b(research|spike|explore|poc)\b/i, 60],
];

export function categorizeLocally(title: string, description?: string): {
  priority: "P0" | "P1" | "P2" | "P3";
  tags: string[];
  estimate: number;
} {
  const text = `${title} ${description ?? ""}`.toLowerCase();

  let priority: "P0" | "P1" | "P2" | "P3" = "P2";
  for (const [pattern, p] of PRIORITY_PATTERNS) {
    if (pattern.test(text)) {
      priority = p;
      break;
    }
  }

  const tags = new Set<string>();
  for (const [pattern, tag] of TAG_PATTERNS) {
    if (pattern.test(text)) {
      tags.add(tag);
    }
  }

  let estimate = 30;
  for (const [pattern, mins] of ESTIMATE_PATTERNS) {
    if (pattern.test(text)) {
      estimate = mins;
      break;
    }
  }

  return { priority, tags: Array.from(tags), estimate };
}
