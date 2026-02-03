"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AnalysisActionsProps {
  contractId: string;
  initialStatus: string;
}

export function AnalysisActions({
  contractId,
  initialStatus,
}: AnalysisActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for status updates when processing
  useEffect(() => {
    if (status !== "PROCESSING") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis/${contractId}`);
        const data = await response.json();

        if (data.status !== "PROCESSING") {
          setStatus(data.status);
          clearInterval(pollInterval);
          // Refresh the page to show results
          router.refresh();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [status, contractId, router]);

  const startAnalysis = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`/api/contracts/${contractId}/analyze`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "LIMIT_REACHED") {
          setError("You've reached your monthly analysis limit. Please upgrade your plan.");
        } else if (data.code === "API_KEY_MISSING") {
          setError("AI service not configured. Please add your Anthropic API key to .env.local");
        } else {
          setError(data.error || "Failed to start analysis");
        }
        return;
      }

      setStatus("PROCESSING");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }, [contractId]);

  const retryAnalysis = useCallback(async () => {
    setStatus("PENDING");
    await startAnalysis();
  }, [startAnalysis]);

  if (status === "COMPLETED") {
    return null; // No actions needed when complete
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status === "PENDING" && (
        <Button onClick={startAnalysis} disabled={isStarting}>
          {isStarting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Starting...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Start Analysis
            </>
          )}
        </Button>
      )}

      {status === "PROCESSING" && (
        <Button disabled>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Analyzing...
        </Button>
      )}

      {status === "FAILED" && (
        <Button onClick={retryAnalysis} disabled={isStarting} variant="outline">
          {isStarting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Retrying...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry Analysis
            </>
          )}
        </Button>
      )}
    </div>
  );
}
