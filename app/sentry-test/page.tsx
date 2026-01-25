"use client";

import { useEffect } from "react";

export default function SentryTestPage() {
  useEffect(() => {
    console.log("Sentry Test Page Loaded. Ready to trigger error.");
  }, []);

  const triggerError = () => {
    console.log("Triggering test error...");
    // @ts-ignore - intentional error for Sentry verification
    myUndefinedFunction();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8 p-8 border rounded-xl bg-card shadow-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight">Sentry Verification</h1>
        <p className="text-muted-foreground">
          Click the button below to trigger a test error and verify your Sentry integration.
        </p>
        <button
          onClick={triggerError}
          className="w-full py-3 px-4 bg-destructive text-destructive-foreground font-semibold rounded-lg hover:bg-destructive/90 transition-colors shadow-sm"
        >
          Trigger Test Error
        </button>
        <div className="pt-4 text-xs text-muted-foreground italic">
          Check your Sentry dashboard after clicking.
        </div>
      </div>
    </div>
  );
}
