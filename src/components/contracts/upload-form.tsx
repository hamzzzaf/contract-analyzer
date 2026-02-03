"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

interface UploadState {
  status: "idle" | "uploading" | "processing" | "success" | "error";
  progress: number;
  message: string;
}

export function UploadForm() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
    message: "",
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload a PDF or DOCX file.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploadState({
        status: "error",
        progress: 0,
        message: error,
      });
      return;
    }

    try {
      setUploadState({
        status: "uploading",
        progress: 20,
        message: "Uploading file...",
      });

      // Direct upload using FormData
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload file");
      }

      const contract = await response.json();

      setUploadState({
        status: "success",
        progress: 100,
        message: "Upload complete! Redirecting...",
      });

      // Redirect to contract page
      setTimeout(() => {
        router.push(`/contracts/${contract.id}`);
      }, 1000);
    } catch (err) {
      setUploadState({
        status: "error",
        progress: 0,
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const resetUpload = () => {
    setUploadState({
      status: "idle",
      progress: 0,
      message: "",
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        {uploadState.status === "idle" && (
          <div
            className={`relative rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-4 text-lg font-medium">
              Drop your contract here, or click to browse
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Supports PDF and DOCX files up to 10MB
            </p>
          </div>
        )}

        {(uploadState.status === "uploading" ||
          uploadState.status === "processing") && (
          <div className="py-8 text-center">
            <Progress value={uploadState.progress} className="mb-4" />
            <p className="text-sm text-gray-600">{uploadState.message}</p>
          </div>
        )}

        {uploadState.status === "success" && (
          <div className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="mt-4 font-medium text-green-600">
              {uploadState.message}
            </p>
          </div>
        )}

        {uploadState.status === "error" && (
          <div className="py-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <p className="mt-4 font-medium text-red-600">
              {uploadState.message}
            </p>
            <Button onClick={resetUpload} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
