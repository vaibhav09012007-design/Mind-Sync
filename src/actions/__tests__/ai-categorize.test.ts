import { describe, it, expect, vi, beforeEach } from "vitest";
import { categorizeLocally } from "./test-helpers";

/**
 * Tests for NL parsing and AI categorization logic
 * Tests the local/heuristic paths (no API key needed)
 */

// --- AI Categorize: Local Heuristic Tests ---

describe("Local Task Categorization", () => {
  describe("priority detection", () => {
    it("assigns P0 for urgent/critical keywords", () => {
      expect(categorizeLocally("Fix critical prod bug").priority).toBe("P0");
      expect(categorizeLocally("Urgent: deploy hotfix").priority).toBe("P0");
      expect(categorizeLocally("ASAP - server down").priority).toBe("P0");
    });

    it("assigns P1 for important/high keywords", () => {
      expect(categorizeLocally("Important client review").priority).toBe("P1");
      expect(categorizeLocally("High priority deadline").priority).toBe("P1");
    });

    it("assigns P3 for low priority keywords", () => {
      expect(categorizeLocally("Minor cleanup someday").priority).toBe("P3");
      expect(categorizeLocally("Nice to have backlog item").priority).toBe("P3");
    });

    it("defaults to P2 for normal tasks", () => {
      expect(categorizeLocally("Update documentation").priority).toBe("P2");
      expect(categorizeLocally("Buy groceries").priority).toBe("P2");
    });
  });

  describe("tag detection", () => {
    it("detects bug-related tags", () => {
      const result = categorizeLocally("Fix login crash bug");
      expect(result.tags).toContain("bug");
    });

    it("detects feature tags", () => {
      const result = categorizeLocally("Implement new dashboard");
      expect(result.tags).toContain("feature");
    });

    it("detects multiple tags", () => {
      const result = categorizeLocally("Fix bug and add new test coverage");
      expect(result.tags).toContain("bug");
      expect(result.tags).toContain("testing");
    });

    it("detects design tags", () => {
      const result = categorizeLocally("Update UI layout and CSS styles");
      expect(result.tags).toContain("design");
    });

    it("detects devops tags", () => {
      const result = categorizeLocally("Deploy release to CI pipeline");
      expect(result.tags).toContain("devops");
    });

    it("returns empty tags for generic tasks", () => {
      const result = categorizeLocally("Buy groceries tomorrow");
      expect(result.tags).toHaveLength(0);
    });
  });

  describe("estimate detection", () => {
    it("estimates 15 min for quick tasks", () => {
      expect(categorizeLocally("Quick typo fix").estimate).toBe(15);
    });

    it("estimates 30 min for bug fixes", () => {
      expect(categorizeLocally("Fix login bug").estimate).toBe(30);
    });

    it("estimates 120 min for features", () => {
      expect(categorizeLocally("Implement new feature").estimate).toBe(120);
    });

    it("estimates 240 min for refactors", () => {
      expect(categorizeLocally("Refactor entire auth system").estimate).toBe(240);
    });

    it("defaults to 30 min for unknown tasks", () => {
      expect(categorizeLocally("Buy groceries").estimate).toBe(30);
    });
  });
});
