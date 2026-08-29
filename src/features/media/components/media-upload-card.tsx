"use client";

import { Loader2, Upload, X } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBytes } from "@/features/media/components/media-columns";
import { useUploadMedia } from "@/features/media/hooks/use-upload-media";
import { ApiClientError } from "@/services/api/contracts";
import { MEDIA_ALLOWED_MIME_TYPES } from "@/services/api/media";

const ACCEPTED_TYPES = MEDIA_ALLOWED_MIME_TYPES.join(",");

/**
 * Upload card (T30) — `POST /media` with `multipart/form-data`.
 *
 * The file leaf for the gallery: file picker (plus drag & drop), optional
 * alt text/title, and pending/success/error states. The service owns the
 * request; this leaf never touches `fetch` and never sets `Content-Type`
 * (the browser must boundary the multipart body).
 *
 * ## Honest dedup copy
 *
 * The backend dedups by checksum and returns the EXISTING row unmodified —
 * the alt text/title typed here are silently discarded on a hit and the
 * response cannot be distinguished from a fresh upload. The card therefore
 * always states that behavior and shows the metadata of the row the server
 * actually returned, rather than pretending the typed values were saved.
 */
export function MediaUploadCard() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);
  const mutation = useUploadMedia();

  function selectFile(next: File | null) {
    setFile(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSubmit() {
    if (!file || mutation.isPending) return;
    mutation.mutate(
      {
        file,
        meta: {
          altText: altText.trim() === "" ? undefined : altText,
          title: title.trim() === "" ? undefined : title,
        },
      },
      {
        onSuccess: () => {
          selectFile(null);
          setAltText("");
          setTitle("");
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload media</CardTitle>
        <CardDescription>
          Add an image to the shared gallery. Allowed types: JPEG, PNG, WebP,
          AVIF — the server detects the real type from the file&apos;s bytes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const dropped = event.dataTransfer.files?.[0];
            if (dropped) selectFile(dropped);
          }}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            dragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <Upload className="size-5 text-muted-foreground" aria-hidden="true" />
          <span className="font-medium text-sm">
            {file ? file.name : "Drop an image here or click to browse"}
          </span>
          <span className="text-muted-foreground text-xs">
            {file
              ? `${formatBytes(file.size)} — click to choose a different file`
              : "One image per upload"}
          </span>
        </button>
        <input
          ref={inputRef}
          id="media-file-input"
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          aria-label="Choose an image to upload"
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null;
            selectFile(picked);
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="media-alt-text">Alt text (optional)</Label>
            <Input
              id="media-alt-text"
              value={altText}
              maxLength={255}
              placeholder="Red running shoe on white background"
              onChange={(event) => setAltText(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="media-title">Title (optional)</Label>
            <Input
              id="media-title"
              value={title}
              maxLength={255}
              placeholder="Red shoe hero shot"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
        </div>

        {mutation.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>
              {mutation.error instanceof ApiClientError
                ? mutation.error.message
                : "Something went wrong. Please try again."}
            </AlertDescription>
          </Alert>
        ) : null}

        {mutation.isSuccess && mutation.data ? (
          <Alert>
            <AlertTitle>
              In the gallery as “
              {mutation.data.title ?? mutation.data.originalName}”
            </AlertTitle>
            <AlertDescription>
              The metadata above is what the server stored — if this file
              matched an existing entry by checksum, that existing entry (with
              its original alt text/title) is the one shown.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSubmit} disabled={!file || mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Upload aria-hidden="true" />
            )}
            {mutation.isPending ? "Uploading…" : "Upload"}
          </Button>
          {file ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectFile(null)}
              disabled={mutation.isPending}
            >
              <X aria-hidden="true" />
              Clear
            </Button>
          ) : null}
          <p className="text-muted-foreground text-xs">
            If the exact same file already exists, the backend returns that
            existing entry unchanged — alt text and title typed here are
            discarded.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
