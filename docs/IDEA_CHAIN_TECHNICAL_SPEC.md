# Idea Chain System - Technical Specification

**Document Version:** 1.0
**Created:** January 2026
**Status:** Draft - Awaiting Review

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Feature Overview](#feature-overview)
4. [Data Model](#data-model)
5. [API Design](#api-design)
6. [Chain Builder UI](#chain-builder-ui)
7. [Chain Viewer Component](#chain-viewer-component)
8. [Integration Points](#integration-points)
9. [Implementation Phases](#implementation-phases)
10. [Technical Risks & Mitigations](#technical-risks--mitigations)
11. [Open Questions](#open-questions)

---

## Executive Summary

The Idea Chain system enables scholars to trace the intellectual genealogy of concepts through Chassidic literature. A chain maps how an idea evolves from its origin (e.g., Gemara) through intermediary sources (Kabbalah, Tanya) to later applications (20th-century Sichos).

**Key architectural decisions:**
- Chains are **standalone entities** built in a dedicated Chain Builder tool
- Chains can be **embedded as components** in topic pages
- Chains and topics **feed each other** (terms link to definitions, topics embed chains)
- Uses a **DAG structure** supporting multiple parents (synthesis of ideas)
- Hebrew text is **manually entered** (with OCR support), linked to external PDFs
- **Multi-scholar collaboration** with permission levels
- **Version history** to track how understanding evolves
- **Desktop-first** design with progressive disclosure, mobile as secondary

---

## Problem Statement

Scholars studying Chassidic texts often encounter ideas that build on earlier sources. Understanding an idea fully requires tracing its development:

```
Sicha 1925 → Maamar 1880 → Tanya → Zohar → Gemara
```

Currently, this genealogy exists only in scholars' heads or scattered footnotes. There is no systematic way to:
1. Map these chains digitally
2. Present them to learners in an accessible format
3. Connect chains to encyclopedia topic pages

---

## Feature Overview

### What is an Idea Chain?

An Idea Chain is a directed acyclic graph (DAG) of **nodes**, where each node represents a **single source's contribution** to an evolving idea.

### Node Structure

Each node contains two conceptual components:

```
┌─────────────────────────────────────────────────────────────┐
│  BASE IDEA                                                  │
│  The inherited concept from parent node(s)                  │
│  Example: "The soul has five levels"                        │
├─────────────────────────────────────────────────────────────┤
│  CONTRIBUTION                                               │
│  What THIS source adds, changes, or reveals                 │
│  Type: origin | expansion | application | counterpoint |    │
│        synthesis | reframe                                  │
│  Example: "Applies this structure to explain prayer"        │
├─────────────────────────────────────────────────────────────┤
│  CITATION ANCHOR                                            │
│  - Source: Likkutei Torah, Parshas Vayera                   │
│  - Reference: Chapter 3 (chapter-level, not line-level)     │
│  - Quote (Hebrew): "נשמת האדם היא חלק אלוק ממעל"             │
│  - Quote (Translation): "The soul is literally a part..."   │
│  - External Link: sefaria.org/... or PDF on HebrewBooks     │
└─────────────────────────────────────────────────────────────┘
```

### Chain Relationships

Nodes can have:
- **Multiple parents** (synthesis: combining two ideas into one)
- **Multiple children** (an idea spawns multiple interpretations)
- **Side-injections** (a tangential source reframes understanding)

### Scope

This is a **curated specialty feature** for key ideas, not exhaustive coverage. Chains are built for:
- Core concepts in Chabad Chassidus worthy of deep exploration
- Ideas flagged as having significant developmental history
- "Flagship" content that differentiates the encyclopedia

---

## Data Model

### New Directus Collections

#### `idea_chains`

The container entity for a traced concept.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `title` | string | Name of the concept (e.g., "The Five Levels of the Soul") |
| `title_hebrew` | string | Hebrew title |
| `slug` | string | URL-safe identifier |
| `description` | text | Editorial summary of what this chain traces |
| `status` | enum | `draft` \| `review` \| `published` |
| `is_featured` | boolean | Highlight as specialty content |
| `cover_image` | uuid (file) | Optional visual |
| `created_by` | uuid (user) | Scholar who created |
| `date_created` | timestamp | |
| `date_updated` | timestamp | |

#### `idea_chain_collaborators`

Multi-scholar collaboration support.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `chain_id` | integer (FK) | References `idea_chains.id` |
| `user_id` | uuid (FK) | References Directus users |
| `role` | enum | `owner` \| `editor` \| `viewer` |
| `invited_by` | uuid (FK) | Who added this collaborator |
| `date_added` | timestamp | |

**Permission levels:**
- `owner` - Full control, can delete chain, manage collaborators
- `editor` - Can add/edit/remove nodes, edit chain metadata
- `viewer` - Read-only access to draft chains

#### `idea_chain_versions`

Version history for tracking how understanding evolves.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `chain_id` | integer (FK) | References `idea_chains.id` |
| `version_number` | integer | Sequential version (1, 2, 3...) |
| `snapshot` | json | Full chain state at this version |
| `change_summary` | text | What changed in this version |
| `created_by` | uuid (user) | Who made this version |
| `date_created` | timestamp | |

**Versioning approach:**
- Snapshot-based (stores full chain state as JSON)
- Created manually when scholar "publishes" a version, or auto-saved periodically
- Allows comparing versions and reverting if needed

#### `idea_nodes`

A single point in the chain representing one source's contribution.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `chain_id` | integer (FK) | References `idea_chains.id` |
| `source_id` | integer (FK) | References `sources.id` (existing table) |
| `citation_reference` | string | Chapter-level reference (e.g., "Chapter 3", "Parshas Vayera") |
| `quote_hebrew` | text | Hebrew quotation from source |
| `quote_translated` | text | English translation of quote |
| `external_url` | string | Link to Sefaria, HebrewBooks, Chabad.org PDF |
| `contribution_type` | enum | `origin` \| `expansion` \| `application` \| `counterpoint` \| `synthesis` \| `reframe` |
| `contribution_summary` | text | What this node adds to the idea |
| `contribution_summary_hebrew` | text | Hebrew version |
| `base_idea_summary` | text | Optional: restate the inherited idea if complex |
| `approximate_year` | integer | For timeline ordering |
| `position` | integer | Display order hint (for non-chronological arrangement) |
| `is_origin` | boolean | Marks this as a terminus/origin point |
| `metadata` | json | Extensible metadata |
| `created_by` | uuid (user) | |
| `date_created` | timestamp | |

#### `idea_node_links`

Junction table enabling the DAG structure (multiple parents/children).

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | Auto-increment |
| `parent_node_id` | integer (FK) | References `idea_nodes.id` (earlier source) |
| `child_node_id` | integer (FK) | References `idea_nodes.id` (later source) |
| `relationship_type` | enum | `cites` \| `builds_upon` \| `synthesizes_with` \| `reframes_via` |
| `relationship_note` | text | Optional explanation of how they connect |

#### `idea_chain_topics` (Junction)

Links chains to topics for embedding.

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer (PK) | |
| `chain_id` | integer (FK) | References `idea_chains.id` |
| `topic_id` | integer (FK) | References `topics.id` |
| `display_context` | string | Where in the topic this chain appears |
| `order_index` | integer | If multiple chains on one topic |

### Relationship to Existing Schema

```
┌─────────────────┐      ┌─────────────────┐
│    sources      │◄─────│   idea_nodes    │
│  (existing)     │      │     (new)       │
└─────────────────┘      └────────┬────────┘
                                  │
                                  │ chain_id
                                  ▼
                         ┌─────────────────┐
                         │  idea_chains    │
                         │     (new)       │
                         └────────┬────────┘
                                  │
                         ┌────────┴────────┐
                         │idea_chain_topics│
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     topics      │
                         │   (existing)    │
                         └─────────────────┘
```

**Key integration:** `idea_nodes.source_id` references the existing `sources` table, avoiding duplication and leveraging existing source metadata.

---

## API Design

### API Routes

Following existing patterns in `/app/api/`:

#### Chain CRUD

```
GET    /api/idea-chains                    # List chains (with filters)
GET    /api/idea-chains/[slug]             # Get chain with all nodes
POST   /api/idea-chains                    # Create new chain
PATCH  /api/idea-chains/[slug]             # Update chain metadata
DELETE /api/idea-chains/[slug]             # Delete chain (admin only)
```

#### Node Management

```
GET    /api/idea-chains/[slug]/nodes       # Get all nodes for a chain
POST   /api/idea-chains/[slug]/nodes       # Add node to chain
PATCH  /api/idea-chains/[slug]/nodes/[id]  # Update node
DELETE /api/idea-chains/[slug]/nodes/[id]  # Remove node
```

#### Link Management

```
POST   /api/idea-chains/[slug]/links       # Create link between nodes
DELETE /api/idea-chains/[slug]/links/[id]  # Remove link
```

#### Topic Integration

```
GET    /api/topics/[slug]/chains           # Get chains for a topic
POST   /api/topics/[slug]/chains           # Link chain to topic
DELETE /api/topics/[slug]/chains/[chainId] # Unlink chain from topic
```

### Response Shapes

#### Chain with Nodes (for viewer)

```typescript
interface IdeaChainResponse {
  id: number;
  title: string;
  titleHebrew: string;
  slug: string;
  description: string;
  status: 'draft' | 'review' | 'published';
  isFeatured: boolean;
  nodes: IdeaNodeResponse[];
  links: IdeaNodeLinkResponse[];
}

interface IdeaNodeResponse {
  id: number;
  sourceId: number;
  sourceTitle: string;       // Denormalized for display
  citationReference: string;
  quoteHebrew: string | null;
  quoteTranslated: string | null;
  externalUrl: string | null;
  contributionType: ContributionType;
  contributionSummary: string;
  baseIdeaSummary: string | null;
  approximateYear: number | null;
  position: number;
  isOrigin: boolean;
}

interface IdeaNodeLinkResponse {
  id: number;
  parentNodeId: number;
  childNodeId: number;
  relationshipType: RelationshipType;
  relationshipNote: string | null;
}
```

---

## Chain Builder UI

A dedicated editor tool optimized for non-technical scholars.

### Route

```
/chain-builder              # List all chains (for editors)
/chain-builder/new          # Create new chain
/chain-builder/[slug]       # Edit existing chain
```

### Design Principles

1. **Simplicity over power** - Scholars are not developers
2. **Visual feedback** - Show the chain structure as it's built
3. **Minimal required fields** - Only mandate what's essential
4. **Inline Hebrew support** - RTL text input, paste from external sources

### UI Components

#### Chain Metadata Form

```
┌─────────────────────────────────────────────────────────────┐
│  Chain Title: [The Five Levels of the Soul              ]  │
│  Hebrew:      [חמש מדרגות הנשמה                          ]  │
│  Description: [                                          ]  │
│               [Traces how the concept of five soul       ]  │
│               [levels develops from Gemara through Tanya ]  │
│  Status:      [Draft ▼]     Featured: [x]                  │
└─────────────────────────────────────────────────────────────┘
```

#### Node List (Simple Mode)

For Phase 1, a form-based linear list:

```
┌─────────────────────────────────────────────────────────────┐
│  NODES                                            [+ Add]   │
├─────────────────────────────────────────────────────────────┤
│  1. Gemara Berachos 10a                          [Origin]   │
│     "Five names are called for the soul..."                 │
│     ──────────────────────────────────────────────────────  │
│  2. Zohar, Parshas Mishpatim                    [Expands]   │
│     Builds on: #1                                           │
│     "The Zohar elaborates on Kabbalistic structure..."      │
│     ──────────────────────────────────────────────────────  │
│  3. Tanya, Chapter 2                          [Synthesis]   │
│     Builds on: #1, #2                                       │
│     "Synthesizes Gemara and Zohar into practical terms"     │
└─────────────────────────────────────────────────────────────┘
```

#### Node Edit Form

```
┌─────────────────────────────────────────────────────────────┐
│  ADD NODE                                                   │
├─────────────────────────────────────────────────────────────┤
│  Source: [Search sources...                            🔍]  │
│          Selected: Tanya - Rabbi Shneur Zalman             │
│                                                             │
│  Reference: [Chapter 2                                   ]  │
│             (Chapter-level, not line-based)                 │
│                                                             │
│  Quote (Hebrew):                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ נפש השנית בישראל היא חלק אלוק ממעל ממש               │  │
│  └──────────────────────────────────────────────────────┘  │
│  [Paste from OCR] [Import from Sefaria]                    │
│                                                             │
│  Translation:                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ The second soul in Israel is literally a part of     │  │
│  │ G-d above...                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  External Link: [https://sefaria.org/Tanya.2            ]  │
│                                                             │
│  ─────────────── Contribution ───────────────               │
│                                                             │
│  Type: [Synthesis ▼]                                        │
│        ○ Origin (first appearance of idea)                  │
│        ○ Expansion (develops existing concept)              │
│        ○ Application (applies to new domain)                │
│        ○ Counterpoint (challenges or qualifies)             │
│        ● Synthesis (combines multiple sources)              │
│        ○ Reframe (new perspective via tangential source)    │
│                                                             │
│  What this source contributes:                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Synthesizes the Gemara's enumeration with Kabbalistic│  │
│  │ structure, presenting a practical framework...        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Year (approx): [1797                                    ]  │
│                                                             │
│  Builds on: [#1 Gemara Berachos] [#2 Zohar Mishpatim]      │
│             [+ Add parent]                                  │
│                                                             │
│                              [Cancel]  [Save Node]          │
└─────────────────────────────────────────────────────────────┘
```

#### Visual Chain Preview

A read-only visualization showing the structure:

```
┌─────────────────────────────────────────────────────────────┐
│  CHAIN PREVIEW                                              │
│                                                             │
│       ┌────────────┐                                        │
│       │  Gemara    │                                        │
│       │ ~200 CE    │                                        │
│       └─────┬──────┘                                        │
│             │                                               │
│             ▼                                               │
│       ┌────────────┐                                        │
│       │   Zohar    │                                        │
│       │ ~1300 CE   │                                        │
│       └─────┬──────┘                                        │
│             │                                               │
│             ▼                                               │
│       ┌────────────┐                                        │
│       │   Tanya    │◄────── Synthesis of above             │
│       │   1797     │                                        │
│       └─────┬──────┘                                        │
│             │                                               │
│      ┌──────┴──────┐                                        │
│      ▼             ▼                                        │
│ ┌─────────┐  ┌─────────┐                                    │
│ │ Maamar  │  │ Maamar  │                                    │
│ │  1880   │  │  1920   │                                    │
│ └─────────┘  └─────────┘                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Files

Following existing patterns:

```
/app/chain-builder/
  page.tsx                    # List view
  new/page.tsx               # Create new chain
  [slug]/page.tsx            # Edit chain

/components/chain-builder/
  ChainBuilderProvider.tsx   # Context provider (like EditorProvider)
  ChainMetadataForm.tsx      # Chain title, description, status
  NodeList.tsx               # List of nodes with actions
  NodeEditForm.tsx           # Add/edit node form
  NodeEditModal.tsx          # Modal wrapper for form
  ChainPreview.tsx           # Visual DAG preview
  ParentSelector.tsx         # Multi-select for parent nodes
  SourceSearchInput.tsx      # Reuse existing source search
  HebrewTextInput.tsx        # RTL-aware textarea
```

---

## Chain Viewer Component

An embeddable component for displaying chains in topic pages and standalone.

### Component Signature

```typescript
interface IdeaChainViewerProps {
  chainId?: number;
  chainSlug?: string;
  mode?: 'full' | 'compact' | 'timeline';
  interactive?: boolean;  // Allow clicking into nodes
  showHeader?: boolean;
}

export function IdeaChainViewer(props: IdeaChainViewerProps): JSX.Element;
```

### Display Modes

#### Full Mode (default)

Complete visualization with timeline, quotes, and navigation.

```
┌─────────────────────────────────────────────────────────────┐
│  THE FIVE LEVELS OF THE SOUL                                │
│  Tracing this concept from Gemara to modern Chassidus       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ══════════════════════════════════════════════════════     │
│  ~200 CE            ~1300            1797         1925      │
│     ●─────────────────●───────────────●────────────●        │
│   Gemara            Zohar          Tanya        Sicha       │
│  ══════════════════════════════════════════════════════     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CURRENT: Tanya, Chapter 2 (1797)                    │   │
│  │                                                     │   │
│  │ "נפש השנית בישראל היא חלק אלוק ממעל ממש"            │   │
│  │ "The second soul in Israel is literally..."         │   │
│  │                                                     │   │
│  │ CONTRIBUTION: Synthesis                             │   │
│  │ Synthesizes the Gemara's enumeration with           │   │
│  │ Kabbalistic structure from the Zohar, presenting    │   │
│  │ a practical framework for understanding...          │   │
│  │                                                     │   │
│  │ [◄ Previous: Zohar]          [Next: Maamar 1880 ►] │   │
│  │ [View on Sefaria ↗]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Compact Mode

For sidebar or preview contexts:

```
┌────────────────────────────────┐
│ The Five Levels of the Soul   │
│ 5 sources • Gemara → Sicha    │
│ [Explore full chain →]        │
└────────────────────────────────┘
```

#### Timeline Mode

Horizontal scrollable timeline (good for mobile):

```
┌──────────────────────────────────────────────────────────────────────┐
│ ←  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐  → │
│    │ Gemara │ → │ Zohar  │ → │ Tanya  │ → │Maamar  │ → │ Sicha  │    │
│    │ ~200   │   │ ~1300  │   │ 1797   │   │ 1880   │   │ 1925   │    │
│    └────────┘   └────────┘   └────────┘   └────────┘   └────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Mobile Experience

Step-through card-based navigation:

```
┌─────────────────────────────┐
│      THE FIVE LEVELS        │
│    ● ○ ○ ○ ○  (1 of 5)      │
├─────────────────────────────┤
│                             │
│  GEMARA BERACHOS 10a        │
│  ~200 CE                    │
│                             │
│  "חמשה שמות נקראו לה..."     │
│  "Five names are called     │
│   for the soul..."          │
│                             │
│  ┌───────────────────────┐  │
│  │ ORIGIN                │  │
│  │ First enumeration of  │  │
│  │ the five soul levels  │  │
│  └───────────────────────┘  │
│                             │
│  [View Source ↗]            │
│                             │
├─────────────────────────────┤
│   [← Back]    [Next →]      │
└─────────────────────────────┘
```

### Component Files

```
/components/idea-chain/
  IdeaChainViewer.tsx         # Main viewer component
  ChainTimeline.tsx           # Horizontal timeline
  ChainGraph.tsx              # Full DAG visualization
  NodeCard.tsx                # Individual node display
  NodeNavigator.tsx           # Prev/next navigation
  CompactChainPreview.tsx     # Minimal preview
  MobileChainStepper.tsx      # Mobile step-through UI
```

---

## Integration Points

### Topic Pages

Topics can embed chains via the `idea_chain_topics` junction:

```tsx
// In TopicExperience.tsx or similar
import { IdeaChainViewer } from '@/components/idea-chain/IdeaChainViewer';

function TopicContent({ topic }: { topic: Topic }) {
  return (
    <div>
      {/* Existing content */}
      <Section title="Definition">...</Section>

      {/* Embedded chain */}
      {topic.ideaChains?.map(chain => (
        <Section key={chain.id} title="Evolution of This Idea">
          <IdeaChainViewer chainSlug={chain.slug} mode="full" />
        </Section>
      ))}
    </div>
  );
}
```

### Term Linking

Nodes can reference topic pages for term definitions:

```typescript
// In contribution_summary, support wiki-style links
// "The [[nefesh]] receives from the [[ruach]]..."
// Rendered as links to /topics/nefesh and /topics/ruach
```

### Existing Citation System

Nodes reference `sources` table, which is already used by the citation system:

- Reuse `SourceSearchInput` component from citation modals
- Leverage existing source metadata (publication year, external URLs)
- Consider linking to specific `source_links` for deeper integration

---

## Implementation Phases

### Phase 1: Foundation (MVP)

**Goal:** Enable scholars to create linear chains with basic viewing.

**Database:**
- Create `idea_chains`, `idea_nodes`, `idea_node_links` collections in Directus
- Create `idea_chain_topics` junction

**API:**
- Basic CRUD for chains and nodes
- Simple query for chain with nodes

**Chain Builder:**
- Form-based chain creation
- Linear node list (add, edit, reorder, delete)
- Single parent selection only (no multi-parent yet)
- Basic validation

**Viewer:**
- Simple timeline view
- Node detail cards
- External link support

**What's NOT in Phase 1:**
- Multi-parent (synthesis) support
- Visual graph editor
- Mobile step-through UI
- AI suggestions

### Phase 2: Branching & Visual Editor

**Goal:** Support complex chains with visual editing.

**Enhancements:**
- Multi-parent node links (synthesis)
- Visual graph editor (drag-and-drop nodes, draw connections)
- DAG visualization in viewer
- Contribution type icons and colors

### Phase 3: Integration & Polish

**Goal:** Deep integration with topics and mobile experience.

**Enhancements:**
- Embed chains in topic pages
- Term linking (wiki-style links to topics)
- Mobile step-through UI
- Sefaria API integration (auto-fetch quotes)
- AI-suggested connections (experimental)

### Phase 4: Discovery & Analytics

**Goal:** Make chains discoverable and track usage.

**Enhancements:**
- Chain browsing/search page
- Featured chains on homepage
- Analytics (which chains are viewed, where users drop off)
- User feedback mechanism

---

## Technical Risks & Mitigations

### Risk 1: Data Entry Burden

**Risk:** Creating chains is labor-intensive. Scholars may not adopt it.

**Mitigation:**
- Start with 3-5 flagship chains to prove value
- Design for minimal required fields
- Provide "partial chain is OK" guidance
- Consider AI assistance for suggesting connections (Phase 3+)

### Risk 2: DAG Complexity

**Risk:** Multi-parent relationships create UI/UX complexity.

**Mitigation:**
- Phase 1 uses single-parent only
- Add multi-parent after validating simpler model
- Provide clear visual feedback for complex structures

### Risk 3: Hebrew Text Handling

**Risk:** Mixed RTL/LTR content, paste from various sources, OCR quality.

**Mitigation:**
- Leverage existing Hebrew handling from editor
- Use `dir="auto"` and explicit RTL containers
- Provide OCR preview/correction UI

### Risk 4: External Link Rot

**Risk:** Links to Sefaria/HebrewBooks may change or break.

**Mitigation:**
- Store quote text locally (not just linked)
- Periodic link validation job
- Graceful degradation (show quote even if link broken)

### Risk 5: Scope Creep

**Risk:** Feature expands beyond curated specialty use.

**Mitigation:**
- Explicit "featured/specialty" framing
- Admin controls for who can create chains
- Don't build discovery features until validated

---

## Open Questions

### Resolved

1. **Chain ownership**: ~~Can multiple scholars collaborate on one chain, or is it single-owner?~~
   **RESOLVED: Multi-scholar collaboration** with owner/editor/viewer roles. See `idea_chain_collaborators` table.

2. **Versioning**: ~~Do we need version history for chains?~~
   **RESOLVED: Yes, version history is essential.** See `idea_chain_versions` table.

3. **Public vs. private**: ~~Can scholars create draft chains that aren't visible to end users?~~
   **RESOLVED: Yes**, via status field (draft/review/published).

4. **Inline term linking**: ~~Should we support `[[topic-slug]]` syntax in contribution summaries?~~
   **RESOLVED: No manual WikiLinks.** Instead, implement **automatic topic entity recognition** - the system detects topic names in any text and auto-links them. This is a separate feature that benefits the entire platform, not just chains. See companion spec (to be created).

5. **Mobile-first or desktop-first**: ~~Where do we expect primary usage?~~
   **RESOLVED: Desktop-first** for serious research. Mobile is secondary "cute overlook." Progressive disclosure is key to avoid overwhelming users.

6. **OCR workflow**: ~~Should the chain builder have integrated OCR?~~
   **RESOLVED: Not integrated into chain builder.** Part of scholar workflow: paste screenshot → OCR → review/clean → optionally AI translate → use as quote. Leverages existing OCR infrastructure.

### Still Open

4. **Forking**: Can one chain be "forked" or "branched" to explore alternative genealogies? (Defer to Phase 2+)

---

## Companion Features

### Automatic Topic Entity Linking

**Status:** Separate spec needed

The user requested that topic names be **automatically detected and linked** across the entire system, not just via manual `[[topic]]` syntax. This applies to:
- Idea chain contribution summaries and quotes
- Topic page content
- Source quotes
- Any rendered text

**Implementation approach (high-level):**
1. Maintain dictionary of topic names + aliases (from `topics` table)
2. On render, scan text for matches
3. Wrap matches in clickable links to topic pages
4. Handle edge cases: partial matches, Hebrew/English variants, disambiguation

This is a platform-wide feature that significantly enhances discoverability and deserves its own technical spec.

---

## Appendix: Type Definitions

```typescript
// lib/idea-chains/types.ts

export type ContributionType =
  | 'origin'
  | 'expansion'
  | 'application'
  | 'counterpoint'
  | 'synthesis'
  | 'reframe';

export type RelationshipType =
  | 'cites'
  | 'builds_upon'
  | 'synthesizes_with'
  | 'reframes_via';

export type ChainStatus = 'draft' | 'review' | 'published';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface IdeaChain {
  id: number;
  title: string;
  titleHebrew: string | null;
  slug: string;
  description: string | null;
  status: ChainStatus;
  isFeatured: boolean;
  coverImage: string | null;
  createdBy: string;
  dateCreated: string;
  dateUpdated: string;
}

export interface IdeaChainCollaborator {
  id: number;
  chainId: number;
  userId: string;
  role: CollaboratorRole;
  invitedBy: string;
  dateAdded: string;
}

export interface IdeaChainVersion {
  id: number;
  chainId: number;
  versionNumber: number;
  snapshot: IdeaChainSnapshot;
  changeSummary: string | null;
  createdBy: string;
  dateCreated: string;
}

export interface IdeaChainSnapshot {
  chain: Omit<IdeaChain, 'id'>;
  nodes: Omit<IdeaNode, 'id' | 'chainId'>[];
  links: Omit<IdeaNodeLink, 'id'>[];
}

export interface IdeaNode {
  id: number;
  chainId: number;
  sourceId: number;
  citationReference: string;
  quoteHebrew: string | null;
  quoteTranslated: string | null;
  externalUrl: string | null;
  contributionType: ContributionType;
  contributionSummary: string;
  contributionSummaryHebrew: string | null;
  baseIdeaSummary: string | null;
  approximateYear: number | null;
  position: number;
  isOrigin: boolean;
  metadata: Record<string, unknown> | null;
  createdBy: string;
  dateCreated: string;
}

export interface IdeaNodeLink {
  id: number;
  parentNodeId: number;
  childNodeId: number;
  relationshipType: RelationshipType;
  relationshipNote: string | null;
}

export interface IdeaChainTopic {
  id: number;
  chainId: number;
  topicId: number;
  displayContext: string | null;
  orderIndex: number;
}

// For API responses with denormalized source info
export interface IdeaNodeWithSource extends IdeaNode {
  source: {
    id: number;
    title: string;
    authorName: string | null;
    publicationYear: number | null;
  };
}

export interface IdeaChainFull extends IdeaChain {
  nodes: IdeaNodeWithSource[];
  links: IdeaNodeLink[];
  topics?: { id: number; slug: string; title: string }[];
}
```

---

## Next Steps

1. **Review this spec** - Identify gaps, clarify open questions
2. **Create Directus collections** - Using MCP or admin UI
3. **Build Phase 1 API routes** - Following existing patterns
4. **Build Chain Builder UI** - Form-based MVP
5. **Build Chain Viewer** - Timeline + cards
6. **Create first chain** - Test with real content
7. **Iterate based on scholar feedback**

---

*Document prepared by Claude Code based on product requirements discussion.*
