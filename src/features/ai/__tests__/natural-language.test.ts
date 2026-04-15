import { describe, it, expect } from "vitest";
import { parseNaturalLanguageTask, getInputSuggestions } from "@/features/ai/natural-language";

/**
 * Tests for the chrono-node based NL task parser
 */
describe("Natural Language Task Parser", () => {
  describe("parseNaturalLanguageTask", () => {
    it("extracts title from simple input", () => {
      const result = parseNaturalLanguageTask("Buy groceries");
      expect(result.title).toBe("Buy groceries");
      expect(result.priority).toBe("P2");
    });

    it("removes common prefixes like 'remind me to'", () => {
      const result = parseNaturalLanguageTask("remind me to call John");
      expect(result.title).toBe("Call John");
    });

    it("removes 'todo' prefix", () => {
      const result = parseNaturalLanguageTask("todo update the readme");
      expect(result.title).toBe("Update the readme");
    });

    it("detects urgent priority", () => {
      const result = parseNaturalLanguageTask("urgent fix the login page");
      expect(result.priority).toBe("P0");
    });

    it("detects important priority", () => {
      const result = parseNaturalLanguageTask("important review the PR");
      expect(result.priority).toBe("P1");
    });

    it("detects low priority", () => {
      const result = parseNaturalLanguageTask("low priority clean the garage");
      expect(result.priority).toBe("P3");
    });

    it("parses 'tomorrow' as a date", () => {
      const result = parseNaturalLanguageTask("Call mom tomorrow");
      expect(result.dueDate).toBeTruthy();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(result.dueDate!.getDate()).toBe(tomorrow.getDate());
    });

    it("detects explicit time", () => {
      const result = parseNaturalLanguageTask("Meeting tomorrow at 3pm");
      expect(result.hasTime).toBe(true);
    });

    it("defaults to today when no date given", () => {
      const result = parseNaturalLanguageTask("Buy milk");
      expect(result.dueDate).toBeTruthy();
      expect(result.dueDate!.getDate()).toBe(new Date().getDate());
    });

    it("capitalizes first letter of title", () => {
      const result = parseNaturalLanguageTask("buy eggs");
      expect(result.title[0]).toBe("B");
    });
  });

  describe("getInputSuggestions", () => {
    it("suggests times for 'tomorrow' without time", () => {
      const suggestions = getInputSuggestions("Call John tomorrow");
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some((s) => s.includes("at"))).toBe(true);
    });

    it("suggests days for input without date", () => {
      const suggestions = getInputSuggestions("Buy groceries");
      expect(suggestions.some((s) => s.includes("today"))).toBe(true);
    });

    it("limits suggestions to 3", () => {
      const suggestions = getInputSuggestions("Some task");
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });
});
