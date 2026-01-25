"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { reportError } from "@/lib/error-reporting";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error Boundary caught an error:", error, errorInfo);
    
    // Report to monitoring service
    reportError(error, {
      componentStack: errorInfo.componentStack || undefined,
      action: "component_render",
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={this.handleRetry} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error fallback component for use with Suspense
 */
export function ErrorFallback({ 
  error, 
  reset 
}: { 
  error: Error; 
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center rounded-lg border border-destructive/20 bg-destructive/5">
      <AlertTriangle className="w-6 h-6 text-destructive mb-2" />
      <p className="text-sm font-medium mb-1">Error loading content</p>
      <p className="text-xs text-muted-foreground mb-3">{error.message}</p>
      <Button onClick={reset} size="sm" variant="outline">
        Retry
      </Button>
    </div>
  );
}
