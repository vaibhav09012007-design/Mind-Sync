"use client";

/**
 * Import/Export Dialog Component
 * Allows bulk import/export of tasks in CSV/JSON formats
 */

import { useState, useRef } from "react";
import { useStore } from "@/store/useStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  exportTasksToCSV,
  exportTasksToJSON,
  parseTasksFromCSV,
  parseTasksFromJSON,
} from "@/lib/task-utils";
import { bulkImportTasks } from "@/app/actions";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { tasks, setTasks } = useStore();
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("json");
  const [importData, setImportData] = useState("");
  const [importFormat, setImportFormat] = useState<"csv" | "json">("json");
  const [previewTasks, setPreviewTasks] = useState<ReturnType<typeof parseTasksFromJSON>>([]);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export data
  const exportData =
    exportFormat === "csv"
      ? exportTasksToCSV(tasks)
      : exportTasksToJSON(tasks);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], {
      type: exportFormat === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded tasks.${exportFormat}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportData(content);

      // Auto-detect format
      if (file.name.endsWith(".csv")) {
        setImportFormat("csv");
        setPreviewTasks(parseTasksFromCSV(content));
      } else {
        setImportFormat("json");
        setPreviewTasks(parseTasksFromJSON(content));
      }
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    try {
      const parsed =
        importFormat === "csv"
          ? parseTasksFromCSV(importData)
          : parseTasksFromJSON(importData);
      setPreviewTasks(parsed);

      if (parsed.length === 0) {
        toast.error("No valid tasks found in the data");
      } else {
        toast.success(`Found ${parsed.length} tasks`);
      }
    } catch (err) {
      toast.error("Failed to parse data. Check the format.");
      setPreviewTasks([]);
    }
  };

  const handleImport = async () => {
    if (previewTasks.length === 0) {
      toast.error("No tasks to import");
      return;
    }

    setImporting(true);
    try {
      // Add tasks to store
      const newTasks = previewTasks.map((t) => ({
        id: t.id!,
        title: t.title!,
        description: t.description,
        completed: t.completed || false,
        dueDate: t.dueDate || new Date().toISOString(),
        priority: t.priority,
        tags: t.tags,
        estimatedMinutes: t.estimatedMinutes,
        subtasks: t.subtasks || [],
        columnId: t.columnId || "Todo",
      }));

      setTasks([...tasks, ...newTasks]);

      // Sync to database
      const result = await bulkImportTasks(
        newTasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          priority: t.priority,
          estimatedMinutes: t.estimatedMinutes,
          tags: t.tags,
        }))
      );

      if (result.success) {
        toast.success(`Imported ${result.data.imported} tasks`);
        setImportData("");
        setPreviewTasks([]);
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to import tasks");
      }
    } catch (err) {
      toast.error("Failed to import tasks");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Tasks</DialogTitle>
          <DialogDescription>
            Export your tasks to a file or import tasks from CSV/JSON.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            {/* Format Selection */}
            <div className="flex gap-2">
              <Button
                variant={exportFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("json")}
              >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={exportFormat === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportFormat("csv")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Preview ({tasks.length} tasks)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    {copied ? (
                      <Check className="mr-2 h-4 w-4" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={exportData}
                readOnly
                className="h-64 font-mono text-xs"
              />
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            {/* File Upload */}
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <span className="text-sm text-muted-foreground">
                or paste data below
              </span>
            </div>

            {/* Format Selection */}
            <div className="flex gap-2">
              <Button
                variant={importFormat === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportFormat("json")}
              >
                <FileJson className="mr-2 h-4 w-4" />
                JSON
              </Button>
              <Button
                variant={importFormat === "csv" ? "default" : "outline"}
                size="sm"
                onClick={() => setImportFormat("csv")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Paste {importFormat.toUpperCase()} data</Label>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder={
                  importFormat === "json"
                    ? `[\n  { "title": "Task 1", "priority": "P1" },\n  { "title": "Task 2" }\n]`
                    : "Title,Description,Due Date,Priority\nTask 1,My description,2024-01-15,P1"
                }
                className="h-40 font-mono text-xs"
              />
            </div>

            <Button variant="secondary" onClick={handlePreview}>
              Preview
            </Button>

            {/* Preview */}
            {previewTasks.length > 0 && (
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {previewTasks.length} tasks found
                  </span>
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? "Importing..." : "Import All"}
                  </Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {previewTasks.slice(0, 10).map((task, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm py-1"
                    >
                      <span className="truncate flex-1">{task.title}</span>
                      {task.priority && (
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {previewTasks.length > 10 && (
                    <p className="text-sm text-muted-foreground">
                      And {previewTasks.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
