# AGENTS.md

## Project Goal

Build a small browser-based web application using only HTML, CSS, and JavaScript.

The application helps a user track progress in a branching story book / gamebook where:

* One book can contain many possible paths.
* The user makes decisions at page branches.
* Each path may lead to one of many endings.
* The user wants to know which paths and endings have already been reached.
* The user wants to continue partial paths without restarting from the beginning.

The UI should be minimal, modern, clean, and easy to use.

---

## Core Product Requirements

### 1. Book Management

The app must allow the user to:

* Add a new book.
* Edit a book.
* Delete a book.
* Store book metadata:

  * Book title
  * Total path count (optional, example: 80)
  * Total ending count (optional, example: 31)
  * Ending labels or numbers (for example 1 to 31)

A user may track multiple books.

---

### 2. Path Tracking

The app must allow the user to create and save reading paths.

Each path should support:

* A path name or auto-generated label
* Ordered page number sequence
* Decisions taken at each branch
* Status:

  * In progress
  * Completed
  * Reached ending
  * Abandoned / draft
* Optional notes

Example structure:

* Start at page 1
* Decision on page 4: "Open the red door"
* Go to page 18
* Decision on page 18: "Fight"
* Go to page 42
* Ending reached: 7

The user should be able to view previous decisions in the current path while continuing it.

---

### 3. Draft Branches / Alternative Choices

The app should support saving branch alternatives as drafts.

Example:

* At one decision point, the user selects one option now.
* The remaining options can be saved as draft branches.
* The user can later continue those draft branches from that exact point instead of restarting from page 1.

This is an important feature and should be included in the design.

Suggested behavior:

* When a path reaches a decision node, the user can save:

  * The chosen branch as the active continuation
  * The unchosen branches as draft paths
* Draft paths inherit the path history up to that point.
* Draft paths can later be resumed.

---

### 4. Ending Tracking

The app must allow the user to mark which endings were reached for a book.

Requirements:

* Endings can be numbered, such as 1 to 31.
* The user can see which endings are reached and unreached.
* If a path reaches an ending, the ending should automatically be marked as reached.
* The user can also manually mark or unmark endings if needed.

---

### 5. Achievements / Progress View

The app should show progress for each book.

Examples:

* Paths discovered: 23 / 80
* Endings reached: 9 / 31
* Completion percentage
* Count of in-progress paths
* Count of draft branches
* Count of completed paths

The progress view should be visually clear and motivating.

---

## Tech Constraints

Use only:

* HTML
* CSS
* JavaScript

Do not use:

* Frameworks
* Build tools
* TypeScript
* Backend
* Database server

The app must run by opening `index.html` in a browser.

---

## Recommended Data Model

Use `localStorage` for persistence.

Suggested data structure:

```js
{
  books: [
    {
      id: "book_1",
      title: "Book Title",
      totalPaths: 80,
      totalEndings: 31,
      endings: [
        { id: "1", label: "Ending 1", reached: true },
        { id: "2", label: "Ending 2", reached: false }
      ],
      paths: [
        {
          id: "path_1",
          name: "Path 1",
          status: "reached_ending",
          reachedEndingId: "7",
          createdAt: "",
          updatedAt: "",
          steps: [
            {
              type: "page",
              page: 1
            },
            {
              type: "decision",
              page: 4,
              choice: "Open the red door"
            },
            {
              type: "page",
              page: 18
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Storage Rules

Requirements:

* Auto-save after key actions
* Safely load saved data on refresh
* Handle empty or corrupted `localStorage` gracefully
* Provide export and import as JSON if possible
* Do not lose user progress during normal use

---

## UI / UX Requirements

The UI should be:

* Modern
* Minimal
* Responsive
* Easy to understand without documentation

Suggested screens / sections:

* Book list
* Add / edit book form
* Book dashboard
* Path list
* Path details
* Continue path screen
* Endings tracker
* Progress / achievements panel

Suggested UX details:

* Cards for books and paths
* Badges for statuses
* Progress bars for completion
* Confirmation before deleting data
* Clear empty states
* Small and readable forms
* Visually separate current path history from draft branches

---

## Important Behaviors

When the user is entering a new path:

* Show previous steps already taken in that path.
* Help the user detect whether this path looks similar to an existing path.
* Show other paths that share the same early decisions if possible.

When a decision point is added:

* Allow entering all available options if the user wants.
* Allow choosing the current selected option.
* Optionally create draft paths for the unselected options.

When an ending is reached:

* Mark the path as completed.
* Link the path to the ending.
* Update ending progress automatically.

---

## Sample Project File Structure

```text
Ending_Tracker/
│
├── AGENTS.md
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── icons/
│   └── images/
├── data/
│   ├── sample-books.json
│   └── export-template.json
└── components/
    ├── book-card.js
    ├── path-card.js
    ├── ending-grid.js
    └── progress-panel.js
```

---

## Coding Style

* Write clean, readable vanilla JavaScript.
* Use small functions.
* Use descriptive names.
* Avoid deeply nested logic where possible.
* Add comments only where they clarify non-obvious behavior.
* Prefer simple DOM rendering patterns.
* Keep CSS organized and consistent.
* Do not overengineer.

---

## Functional Priorities

Build in this order:

1. Book creation and selection
2. Local storage persistence
3. Path creation and viewing
4. Ending tracking
5. Progress dashboard
6. Draft branch support
7. Import / export
8. Path similarity hints and polish

---

## First Version Scope

The first usable version must include:

* Add book
* Set total paths and endings
* Create and save paths
* Add page steps and decision steps
* Mark endings reached
* View progress counts
* Persist everything in `localStorage`

Draft branches can be added right after the first stable version if needed.

---

## Quality Expectations

Before finishing, verify:

* Data survives page refresh
* Adding, editing, and deleting books works
* Adding, editing, and deleting paths works
* Endings update correctly
* Progress counts are correct
* UI works on desktop and mobile widths
* No obvious console errors
