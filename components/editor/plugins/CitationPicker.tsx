import React, { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import directus from "@/lib/directus";
import { readItems } from "@directus/sdk";
import { useQuery } from "@tanstack/react-query";

interface CitationPickerProps {
    position: { top: number; left: number };
    onSelect: (source: { id: number; title: string }, reference: string) => void;
    onClose: () => void;
}

export const CitationPicker: React.FC<CitationPickerProps> = ({ position, onSelect, onClose }) => {
    const [search, setSearch] = useState("");
    const [reference, setReference] = useState("");
    const [selectedSource, setSelectedSource] = useState<{ id: number; title: string } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Search Sources
    const { data: sources, isLoading } = useQuery({
        queryKey: ['sources-search', search],
        queryFn: async () => {
            if (!search) return [];
            const result = await directus.request(readItems('sources', {
                search: search,
                fields: ['id', 'title'],
                limit: 5
            }));
            return result;
        },
        enabled: search.length > 2
    });

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && selectedSource && reference) {
            onSelect(selectedSource, reference);
        }
    };

    return (
        <div 
            className="absolute z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ 
                top: position.top + 20, 
                left: position.left,
            }}
        >
            <div className="p-2 border-b bg-gray-50 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-600">ADD CITATION</span>
            </div>

            {!selectedSource ? (
                // Step 1: Search Source
                <div className="p-2">
                    <input
                        ref={inputRef}
                        className="w-full text-sm p-1 outline-none"
                        placeholder="Search source (e.g. Tanya)..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {isLoading && <div className="text-xs text-gray-400 p-2">Searching...</div>}
                    <div className="mt-2 space-y-1">
                        {sources?.map((source: any) => (
                            <div
                                key={source.id}
                                className="text-sm px-2 py-1 hover:bg-blue-50 cursor-pointer rounded"
                                onClick={() => setSelectedSource(source)}
                            >
                                {source.title}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // Step 2: Add Reference (Page/Verse)
                <div className="p-2 bg-blue-50">
                    <div className="text-xs text-blue-800 font-medium mb-1">
                        Selected: {selectedSource.title}
                    </div>
                    <div className="flex gap-2">
                        <input
                            ref={inputRef} // Refocus here
                            className="flex-1 text-sm p-1 border rounded outline-none"
                            placeholder="Page/Verse (e.g. p. 42)"
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button
                            className="text-xs bg-blue-600 text-white px-2 rounded"
                            onClick={() => onSelect(selectedSource, reference)}
                        >
                            Add
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
