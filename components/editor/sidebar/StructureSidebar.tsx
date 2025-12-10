import { Document } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/directus";
const directus = createClient();
import { readItems } from "@directus/sdk";
import { ChevronRight, ChevronDown, FileText, Folder } from "lucide-react";
import React, { useState } from "react";

interface StructureSidebarProps {
  currentDocId: string | null;
  onSelectDoc: (id: string) => void;
}

// Recursive Tree Node Component
const TreeNode = ({
  node,
  currentDocId,
  onSelectDoc,
  level = 0,
}: {
  node: Document & { children?: Document[] };
  currentDocId: string | null;
  onSelectDoc: (id: string) => void;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = String(node.id) === currentDocId;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-gray-100 rounded text-sm ${
          isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectDoc(String(node.id))}
      >
        <div
          className="p-0.5 rounded hover:bg-gray-200"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }
          }}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )
          ) : (
            <div className="w-4 h-4" /> // Spacer
          )}
        </div>
        
        {hasChildren ? (
            <Folder className="w-4 h-4 text-gray-500" />
        ) : (
            <FileText className="w-4 h-4 text-gray-400" />
        )}
        
        <span className="truncate">{node.title}</span>
      </div>

      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              currentDocId={currentDocId}
              onSelectDoc={onSelectDoc}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const StructureSidebar: React.FC<StructureSidebarProps> = ({
  currentDocId,
  onSelectDoc,
}) => {
  // Fetch all documents to build the tree
  // In a real app with thousands of docs, we'd fetch lazily or only the relevant subtree
  const {
    data: documents,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["structure-tree"],
    queryFn: async () => {
      try {
        const result = await directus.request(
          readItems("documents", {
            fields: ["id", "title", "parent_id", "doc_type"],
            limit: -1,
            sort: ["title"], // Ideally sort by an order field
          })
        );
        return result as Document[];
      } catch (err: any) {
        // Surface 403 errors with a clear message so the UI can explain what's wrong
        const status = err?.response?.status;
        if (status === 403) {
          throw new Error(
            "FORBIDDEN: This Directus token does not have permission to read the documents collection."
          );
        }
        throw err;
      }
    },
  });

  // Build Tree
  const tree = React.useMemo(() => {
    if (!documents) return [];

    const docMap = new Map<number, Document & { children: Document[] }>();
    const roots: (Document & { children: Document[] })[] = [];

    // Initialize map
    documents.forEach((doc) => {
      docMap.set(doc.id, { ...doc, children: [] });
    });

    // Build hierarchy
    documents.forEach((doc) => {
      const node = docMap.get(doc.id)!;
      if (doc.parent_id) {
        // Handle both number and object parent_id
        const parentId = typeof doc.parent_id === 'object' ? doc.parent_id.id : doc.parent_id;
        const parent = docMap.get(parentId);
        if (parent) {
          parent.children.push(node);
        } else {
          // Parent not found (orphan?), treat as root for now
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [documents]);

  const isForbidden =
    error instanceof Error &&
    error.message.startsWith("FORBIDDEN:");

  return (
    <div className="w-64 border-r bg-gray-50 h-full flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-gray-800">Library Structure</h2>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isLoading && !error && (
          <div className="text-xs text-gray-500 p-2">Loading documents…</div>
        )}

        {isForbidden && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Editor cannot load documents (403 Forbidden).</p>
            <p>
              The Directus token configured in <code>.env.local</code> does not have read
              access to the <code>documents</code> collection.
            </p>
            <p>
              Update Directus Access Control to allow <code>documents</code> read for this
              token, then refresh the editor.
            </p>
          </div>
        )}

        {!isForbidden && tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            currentDocId={currentDocId}
            onSelectDoc={onSelectDoc}
          />
        ))}
      </div>
    </div>
  );
};
