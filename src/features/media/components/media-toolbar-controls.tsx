"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { MEDIA_ALLOWED_MIME_TYPES } from "@/services/api/media";

interface MediaToolbarControlsProps {
  /** Current `search` URL param (server-side filename+title match). */
  search: string;
  /** Current `mimeType` URL param (exact match, e.g. `image/png`). */
  mimeType: string;
  onSearchChange: (value: string) => void;
  onMimeTypeChange: (value: string) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Gallery toolbar controls (T30) — search box + media-type filter.
 *
 * Both write URL state (`shallow: false` in the screen's `useQueryStates`),
 * which is what the server-controlled query is built from — the same
 * URL-driven mechanism `useDataTable` uses for page/limit/sort, so the
 * toolbar, table, and API query can never disagree. Search is debounced;
 * the type select applies immediately. Both reset the page to 1 (handled by
 * the screen's change handlers).
 */
export function MediaToolbarControls({
  search,
  mimeType,
  onSearchChange,
  onMimeTypeChange,
}: MediaToolbarControlsProps) {
  const [searchValue, setSearchValue] = React.useState(search);
  const lastPropagated = React.useRef(search);

  React.useEffect(() => {
    if (search !== lastPropagated.current) {
      lastPropagated.current = search;
      setSearchValue(search);
    }
  }, [search]);

  const debouncedSearchChange = useDebouncedCallback((next: string) => {
    lastPropagated.current = next;
    onSearchChange(next);
  }, SEARCH_DEBOUNCE_MS);

  return (
    <div className="flex flex-1 flex-wrap items-center gap-2">
      <div className="grid gap-1">
        <Label htmlFor="media-search" className="sr-only">
          Search media
        </Label>
        <Input
          id="media-search"
          type="search"
          placeholder="Search filename or title…"
          value={searchValue}
          maxLength={255}
          onChange={(event) => {
            const next = event.target.value;
            setSearchValue(next);
            debouncedSearchChange(next);
          }}
          className="h-8 w-44 lg:w-56"
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="media-mime-filter" className="sr-only">
          Filter by media type
        </Label>
        <Select
          value={mimeType === "" ? "all" : mimeType}
          onValueChange={(value) => {
            onMimeTypeChange(value === "all" ? "" : value);
          }}
        >
          <SelectTrigger id="media-mime-filter" className="h-8 w-40">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MEDIA_ALLOWED_MIME_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="font-mono">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
