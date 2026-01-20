# Smart Context 2.0: 10x-ing the Data Visualization

The goal is to move from "static charts" to "dynamic, useful tools" that actively help the user learn.

## 1. The Core Differentiation (Mental Model)

We need to treat these as two distinct lenses on the same information:

*   **Concept DNA (The "Microscope"):**
    *   **Focus:** Internal Composition. What is *this* idea made of?
    *   **Question:** "What is the nature of this concept?"
    *   **Analogy:** A nutrition label or an RPG character stat block.
    *   **Current State:** Static Radar Chart (Intellect/Emotion/Action).
    *   **10x Goal:** Interactive simulator. Show how the specific balance of these traits defines the concept.

*   **Concept Constellation (The "Telescope"):**
    *   **Focus:** External Context. Where does this idea fit in the universe?
    *   **Question:** "How do I get here, and where do I go next?"
    *   **Analogy:** A GPS or subway map.
    *   **Current State:** 2-depth node graph (Parent/Opposite/Child).
    *   **10x Goal:** "Wayfinding" tool. Dynamic pathing based on user knowledge.

---

## 2. Brainstorming: 10x Features

### A. Concept DNA (The "Microscope")

**Problem:** Currently it's just a label. "Oh, it's 80% intellectual." So what?
**Solution:** Make it *predictive* or *interactive*.

1.  **"What if?" Slider (The Simulator):**
    *   Allow user to adjust the sliders. "What happens if I try to do *Avodah* with high Emotion but zero Intellect?"
    *   *System Response:* The label changes from "Avodah" to "Hispailus (Ecstasy)" or "Klippas Nogah" (just kidding, but you get the point). It shows *why* the balance matters.
2.  **Comparative DNA Overlay:**
    *   "Compare with..." button.
    *   Overlay the triangle of a similar concept (e.g., *Mesiras Nefesh*) on top.
    *   Visually highlight the *delta*. "Ah, I see *Avodah* requires more detailed study (Intellect) than simple *Mesiras Nefesh*."
3.  **Persona Mapping:**
    *   Map the "Soul Powers" (Chochmah, Binah, Daas, Chessed, Gevurah, etc.) to the points. Hovering over "Intellect" lights up the specific sefiros involved (e.g., *Chochmah* and *Binah*).

### B. Concept Constellation (The "Telescope")

**Problem:** It's a static map. It doesn't know who *I* am or what I know.
**Solution:** Make it a "Learning GPS".

1.  **"You Are Here" Context:**
    *   Mark nodes as "Learned" (Green), "In Progress" (Yellow), and "Unknown" (Gray).
    *   Draw the *path* the user actually took to get here.
2.  **Prerequisite Warnings (The Red Line):**
    *   If a "Parent" concept (e.g., *Tzimtzum*) is marked "Unknown", draw a red dashed line to it. "Warning: Structural dependency missing."
3.  **Visual "Click-to-Expand" (Infinite Canvas):**
    *   Don't just link to a new page. Clicking a node *centers* the graph on that node and expands *its* neighbors dynamically.
    *   Allow the user to traverse the entire network without leaving the page, previewing definitions in bottom sheets.
4.  **"The Shortest Path" Generator:**
    *   User sets a goal: "I want to understand *Atzmus*."
    *   System highlights the path from the *current* concept to that goal interactively on the graph.

---

## 3. Proposal for Next Iterate

**Phase 1: DNA "Comparator"**
*   Add a simple selector to overlay a second concept on the radar chart.
*   *Why:* Immediately adds utility by defining concepts *by their contrast* to others.

**Phase 2: Constellation "Explorer"**
*   Make the nodes clickable.
*   Clicking a node opens a "Quick Preview" bottom sheet for that concept *without* leaving the graph.
*   Add a "Navigate" button to that preview to actually go there.
*   *Why:* Encourages rabbit-hole learning without losing context.
