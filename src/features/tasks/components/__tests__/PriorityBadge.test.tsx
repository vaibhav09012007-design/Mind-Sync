/**
 * Tests for PriorityBadge component
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PriorityBadge, PrioritySelector, priorityConfig } from "../PriorityBadge";

describe("PriorityBadge", () => {
  it("renders correctly with P0 priority", () => {
    render(<PriorityBadge priority="P0" />);
    expect(screen.getByText("P0")).toBeInTheDocument();
  });

  it("renders correctly with P1 priority", () => {
    render(<PriorityBadge priority="P1" />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("renders correctly with P2 priority", () => {
    render(<PriorityBadge priority="P2" />);
    expect(screen.getByText("P2")).toBeInTheDocument();
  });

  it("renders correctly with P3 priority", () => {
    render(<PriorityBadge priority="P3" />);
    expect(screen.getByText("P3")).toBeInTheDocument();
  });

  it("renders icon when showLabel is false", () => {
    render(<PriorityBadge priority="P0" showLabel={false} />);
    expect(screen.queryByText("P0")).not.toBeInTheDocument();
    // Check for the Flag icon
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("applies small size correctly", () => {
    const { container } = render(<PriorityBadge priority="P0" size="sm" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass("text-[10px]");
  });

  it("applies medium size correctly", () => {
    const { container } = render(<PriorityBadge priority="P0" size="md" />);
    const badge = container.firstChild;
    expect(badge).toHaveClass("text-xs");
  });
});

describe("PrioritySelector", () => {
  it("renders current priority", () => {
    render(<PrioritySelector value="P1" onChange={() => {}} />);
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("shows dropdown with all priorities on click", async () => {
    render(<PrioritySelector value="P1" onChange={() => {}} />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    
    // All priorities should be visible in dropdown
    expect(await screen.findByText("Critical")).toBeInTheDocument();
    expect(await screen.findByText("High")).toBeInTheDocument();
    expect(await screen.findByText("Medium")).toBeInTheDocument();
    expect(await screen.findByText("Low")).toBeInTheDocument();
  });

  it("calls onChange when priority is selected", async () => {
    const onChange = vi.fn();
    render(<PrioritySelector value="P1" onChange={onChange} />);
    
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    
    const p0Option = await screen.findByText("Critical");
    fireEvent.click(p0Option.parentElement!);
    
    expect(onChange).toHaveBeenCalledWith("P0");
  });
});

describe("priorityConfig", () => {
  it("has correct configuration for all priorities", () => {
    const priorities = ["P0", "P1", "P2", "P3"] as const;
    
    priorities.forEach((p) => {
      expect(priorityConfig[p]).toBeDefined();
      expect(priorityConfig[p].label).toBe(p);
      expect(priorityConfig[p].color).toBeDefined();
      expect(priorityConfig[p].bgColor).toBeDefined();
      expect(priorityConfig[p].description).toBeDefined();
    });
  });

  it("P0 is Critical", () => {
    expect(priorityConfig.P0.description).toBe("Critical");
  });

  it("P1 is High", () => {
    expect(priorityConfig.P1.description).toBe("High");
  });

  it("P2 is Medium", () => {
    expect(priorityConfig.P2.description).toBe("Medium");
  });

  it("P3 is Low", () => {
    expect(priorityConfig.P3.description).toBe("Low");
  });
});
