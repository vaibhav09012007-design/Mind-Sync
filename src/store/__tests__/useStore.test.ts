import { describe, it, expect, beforeEach, vi } from "vitest";
import { useStore } from "../useStore";

// Mock the database module to avoid DATABASE_URL errors in tests
vi.mock("@/db", () => ({
  db: {},
}));

vi.mock("@/actions/tasks", () => ({
  createTask: vi.fn().mockResolvedValue({ id: "test-id" }),
  updateTask: vi.fn().mockResolvedValue({}),
  deleteTask: vi.fn().mockResolvedValue({}),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useStore - Timer Actions", () => {
  beforeEach(() => {
    // Reset timer to defaults
    useStore.setState({
      timerMode: "focus",
      timeLeft: 25 * 60,
      isTimerRunning: false,
      completedSessions: 0,
    });
  });

  it("should set timer mode", () => {
    const store = useStore.getState();

    store.setTimerMode("focus");
    expect(useStore.getState().timerMode).toBe("focus");

    store.setTimerMode("shortBreak");
    expect(useStore.getState().timerMode).toBe("shortBreak");

    store.setTimerMode("longBreak");
    expect(useStore.getState().timerMode).toBe("longBreak");
  });

  it("should set timer running state", () => {
    const store = useStore.getState();

    store.setTimerRunning(true);
    expect(useStore.getState().isTimerRunning).toBe(true);

    store.setTimerRunning(false);
    expect(useStore.getState().isTimerRunning).toBe(false);
  });

  it("should set time left", () => {
    const store = useStore.getState();

    store.setTimeLeft(1200);
    expect(useStore.getState().timeLeft).toBe(1200);
  });

  it("should update timer settings", () => {
    const store = useStore.getState();

    store.updateTimerSettings({
      focusDuration: 30,
      shortBreakDuration: 10,
    });

    const settings = useStore.getState().timerSettings;
    expect(settings.focusDuration).toBe(30);
    expect(settings.shortBreakDuration).toBe(10);
  });

  it("should increment completed sessions", () => {
    const store = useStore.getState();
    expect(store.completedSessions).toBe(0);

    store.incrementCompletedSessions();
    expect(useStore.getState().completedSessions).toBe(1);

    store.incrementCompletedSessions();
    expect(useStore.getState().completedSessions).toBe(2);
  });

  it("should reset timer", () => {
    const store = useStore.getState();

    // Modify state first
    store.setTimerRunning(true);
    store.setTimeLeft(500);

    // Reset
    store.resetTimer();

    expect(useStore.getState().isTimerRunning).toBe(false);
  });
});

describe("useStore - Column Actions", () => {
  beforeEach(() => {
    // Reset columns to defaults
    useStore.setState({
      columns: [
        { id: "Todo", title: "To Do", color: "text-slate-600", bgColor: "bg-slate-50", order: 0 },
        {
          id: "InProgress",
          title: "In Progress",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          order: 1,
        },
        { id: "Done", title: "Done", color: "text-green-600", bgColor: "bg-green-50", order: 2 },
      ],
    });
  });

  it("should add a new column", () => {
    const store = useStore.getState();
    const initialColumnCount = store.columns.length;

    store.addColumn({
      title: "New Column",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    });

    const columns = useStore.getState().columns;
    expect(columns.length).toBe(initialColumnCount + 1);
    expect(columns[columns.length - 1].title).toBe("New Column");
  });

  it("should update column properties", () => {
    const store = useStore.getState();
    const columnId = store.columns[0].id;

    store.updateColumn(columnId, {
      title: "Updated Column",
      wipLimit: 5,
    });

    const updatedColumn = useStore.getState().columns.find((c) => c.id === columnId);
    expect(updatedColumn?.title).toBe("Updated Column");
    expect(updatedColumn?.wipLimit).toBe(5);
  });

  it("should delete a column", () => {
    const store = useStore.getState();
    const initialCount = store.columns.length;
    const columnToDelete = store.columns[2].id;

    store.deleteColumn(columnToDelete);

    const columns = useStore.getState().columns;
    expect(columns.length).toBe(initialCount - 1);
    expect(columns.find((c) => c.id === columnToDelete)).toBeUndefined();
  });
});

describe("useStore - View Settings", () => {
  it("should update view settings", () => {
    const store = useStore.getState();

    store.setViewSettings({
      mode: "list",
      density: "compact",
    });

    const settings = useStore.getState().viewSettings;
    expect(settings.mode).toBe("list");
    expect(settings.density).toBe("compact");
  });

  it("should toggle cover images", () => {
    const store = useStore.getState();

    store.setViewSettings({ showCoverImages: false });
    expect(useStore.getState().viewSettings.showCoverImages).toBe(false);

    store.setViewSettings({ showCoverImages: true });
    expect(useStore.getState().viewSettings.showCoverImages).toBe(true);
  });
});

describe("useStore - Task State Management", () => {
  beforeEach(() => {
    useStore.setState({ tasks: [] });
  });

  it("should set tasks directly", () => {
    const store = useStore.getState();
    const testTasks = [
      {
        id: "1",
        title: "Task 1",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
      {
        id: "2",
        title: "Task 2",
        completed: true,
        dueDate: new Date().toISOString(),
        columnId: "Done",
      },
    ];

    store.setTasks(testTasks);
    expect(useStore.getState().tasks).toHaveLength(2);
    expect(useStore.getState().tasks[0].title).toBe("Task 1");
  });

  it("should update a single task", () => {
    const store = useStore.getState();
    store.setTasks([
      {
        id: "1",
        title: "Original",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
    ]);

    store.updateTask("1", { title: "Updated", priority: "P0" });

    const task = useStore.getState().tasks[0];
    expect(task.title).toBe("Updated");
    expect(task.priority).toBe("P0");
  });

  it("should toggle task completion", () => {
    const store = useStore.getState();
    store.setTasks([
      {
        id: "1",
        title: "Test",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
    ]);

    store.toggleTask("1");
    expect(useStore.getState().tasks[0].completed).toBe(true);
    expect(useStore.getState().tasks[0].completedAt).toBeDefined();

    store.toggleTask("1");
    expect(useStore.getState().tasks[0].completed).toBe(false);
  });

  it("should delete a task", () => {
    const store = useStore.getState();
    store.setTasks([
      {
        id: "1",
        title: "Delete Me",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
    ]);

    store.deleteTask("1");
    expect(useStore.getState().tasks).toHaveLength(0);
  });

  it("should bulk delete tasks", () => {
    const store = useStore.getState();
    store.setTasks([
      {
        id: "1",
        title: "Task 1",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
      {
        id: "2",
        title: "Task 2",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
      {
        id: "3",
        title: "Task 3",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
    ]);

    store.bulkDeleteTasks(["1", "3"]);

    const tasks = useStore.getState().tasks;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("2");
  });

  it("should bulk update tasks", () => {
    const store = useStore.getState();
    store.setTasks([
      {
        id: "1",
        title: "Task 1",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
      {
        id: "2",
        title: "Task 2",
        completed: false,
        dueDate: new Date().toISOString(),
        columnId: "Todo",
      },
    ]);

    store.bulkUpdateTasks(["1", "2"], { priority: "P0", columnId: "InProgress" });

    const tasks = useStore.getState().tasks;
    expect(tasks[0].priority).toBe("P0");
    expect(tasks[0].columnId).toBe("InProgress");
    expect(tasks[1].priority).toBe("P0");
  });
});
