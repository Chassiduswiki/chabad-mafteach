"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { DialogTitle } from "@radix-ui/react-dialog";
import {
  Loader2,
  BookOpenText,
  PlusCircle,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useSourceSearch } from "@/lib/hooks/useSourceSearch";
import { useCreateSource } from "@/lib/hooks/useCreateSource";
import { useAuthorSearch } from "@/lib/hooks/useAuthorSearch";

type ViewState = "search" | "reference" | "create";

interface CitationCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (source: { id: number; title: string }, reference: string) => void;
  onFeedback?: (payload: { type: "success" | "error"; message: string }) => void;
}

export function CitationCommandPalette({
  open,
  onOpenChange,
  onComplete,
  onFeedback,
}: CitationCommandPaletteProps) {
  const { search, setSearch, results, isLoading } = useSourceSearch();
  const { createSource, status, error, matchedAuthor, reset } = useCreateSource();
  const {
    search: authorSearch,
    setSearch: setAuthorSearch,
    results: authorResults,
  } = useAuthorSearch();

  const [view, setView] = useState<ViewState>("search");
  const [selectedSource, setSelectedSource] = useState<{ id: number; title: string } | null>(
    null
  );
  const [draftTitle, setDraftTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [reference, setReference] = useState("");

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);

  const isCreating = status === "creating-author" || status === "creating-source";

  useEffect(() => {
    if (open) {
      setView("search");
      setSelectedSource(null);
      setDraftTitle("");
      setAuthorName("");
      setReference("");
      setSearch("");
      setAuthorSearch("");
      reset();
    }
  }, [open, setSearch, setAuthorSearch, reset]);

  useEffect(() => {
    if (!open) return;

    if (view === "search") {
      searchInputRef.current?.focus();
    } else if (view === "reference") {
      referenceInputRef.current?.focus();
    } else if (view === "create") {
      authorInputRef.current?.focus();
    }
  }, [view, open]);

  const goBackToSearch = () => {
    setView("search");
    setSelectedSource(null);
    setDraftTitle("");
    setAuthorName("");
    setReference("");
    reset();
  };

  const handleSelectSource = (source: { id: number; title: string }) => {
    setSelectedSource(source);
    setReference("");
    setView("reference");
  };

  const handleCreateOption = (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setDraftTitle(trimmed);
    setAuthorName("");
    setAuthorSearch(trimmed);
    setReference("");
    setView("create");
  };

  const handleSubmitReference = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSource) return;
    const cleaned = reference.trim();
    if (!cleaned) return;

    onComplete(selectedSource, cleaned);
    onFeedback?.({
      type: "success",
      message: `Inserted citation from ${selectedSource.title}`,
    });
    onOpenChange(false);
  };

  const handleSubmitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanedTitle = draftTitle.trim();
    const cleanedReference = reference.trim();

    if (!cleanedTitle || !cleanedReference || isCreating) {
      return;
    }

    try {
      const source = await createSource({
        title: cleanedTitle,
        authorName: authorName.trim() ? authorName.trim() : undefined,
      });

      onComplete({ id: source.id, title: source.title }, cleanedReference);
      onFeedback?.({
        type: "success",
        message: `Created “${source.title}” and inserted citation`,
      });
      onOpenChange(false);
    } catch (err) {
      // Error state handled via hook state
      onFeedback?.({
        type: "error",
        message:
          err instanceof Error ? err.message : "Unable to create source right now",
      });
    }
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search sources to cite"
      className="fixed z-[100] inset-0 flex items-start justify-center pt-24 bg-black/40"
    >
      <DialogTitle className="sr-only">Citation command palette</DialogTitle>
      <div 
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
      >
        <Command className="w-full">
          {view === "search" ? (
            <>
              <div className="flex items-center px-4 border-b border-gray-200">
                <Command.Input
                  ref={searchInputRef}
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type to search sources..."
                  className="py-3 text-base outline-none flex-1"
                />
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                ) : null}
              </div>

              <Command.List className="max-h-80 overflow-y-auto">
                {results.length > 0 ? (
                  <Command.Group heading="Sources">
                    {results.map((source) => (
                      <Command.Item
                        key={source.id}
                        value={`source:${source.id}`}
                        onSelect={() => handleSelectSource(source)}
                        className="px-4 py-3 flex items-center gap-3"
                      >
                        <BookOpenText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-800">{source.title}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                ) : (
                  <Command.Empty className="px-4 py-3 text-sm text-gray-500">
                    No sources found
                  </Command.Empty>
                )}

                {search.trim() ? (
                  <Command.Group heading="Actions">
                    <Command.Item
                      value={`create:${search.trim()}`}
                      onSelect={() => handleCreateOption(search.trim())}
                      className="px-4 py-3 flex items-center gap-3"
                    >
                      <PlusCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-800">
                        Create new source "{search.trim()}"
                      </span>
                    </Command.Item>
                  </Command.Group>
                ) : null}
              </Command.List>
            </>
          ) : null}
        </Command>

        {view === "reference" && selectedSource ? (
          <div className="p-5 space-y-4">
            <button
              type="button"
              onClick={goBackToSearch}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to search
            </button>

            <div>
              <h2 className="text-base font-semibold text-gray-800">{selectedSource.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add the page, chapter, or verse you’re citing.
              </p>
            </div>

            <form onSubmit={handleSubmitReference} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Reference</label>
                <input
                  ref={referenceInputRef}
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="e.g. Chapter 12, p. 42"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={!reference.trim()}
                >
                  <Loader2
                    className={`w-4 h-4 animate-spin ${reference.trim() ? "hidden" : "hidden"}`}
                  />
                  Insert citation
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {view === "create" ? (
          <form onSubmit={handleSubmitCreate} className="p-5 space-y-4">
            <button
              type="button"
              onClick={goBackToSearch}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" /> Back to search
            </button>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Source title</label>
              <input
                value={draftTitle}
                onChange={(event) => setDraftTitle(event.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Source title"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Author (optional)</label>
              <input
                ref={authorInputRef}
                value={authorName}
                onChange={(event) => {
                  setAuthorName(event.target.value);
                  setAuthorSearch(event.target.value);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Type a name and press enter to create"
              />
              {matchedAuthor ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertCircle className="w-3 h-3" />
                  Using existing author “{matchedAuthor.canonical_name}”.
                </div>
              ) : null}
              {authorSearch.trim().length >= 2 && authorResults.length > 0 ? (
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                  {authorResults.slice(0, 6).map((author) => (
                    <button
                      key={author.id}
                      type="button"
                      onClick={() => {
                        setAuthorName(author.canonical_name);
                        setAuthorSearch(author.canonical_name);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                    >
                      <BookOpenText className="w-4 h-4 text-blue-400" />
                      <span>{author.canonical_name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Reference</label>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="e.g. Chapter 3, Section 2"
              />
            </div>

            {isCreating ? (
              <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                <Loader2 className="w-3 h-3 animate-spin" />
                {status === "creating-author" ? "Creating author…" : "Creating source…"}
              </div>
            ) : null}

            {error ? (
              <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="w-3 h-3" />
                {error}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={goBackToSearch}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !draftTitle.trim() || !reference.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create & cite
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </Command.Dialog>
  );
}
