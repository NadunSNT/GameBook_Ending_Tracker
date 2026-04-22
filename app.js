const STORAGE_KEY = "endingTrackerData_v1";
const THEME_KEY = "endingTrackerTheme_v1";
const GUIDE_COOKIE = "endingTrackerGuideSeen";
const GUIDE_FALLBACK_KEY = "endingTrackerGuideSeen_v1";

const state = {
  data: { books: [] },
  selectedBookId: null,
  selectedPathId: null,
  showingMap: false,
  editingBookId: null,
  editingPathId: null,
  editingStepIndex: null,
  draggingStepIndex: null,
  pendingEndingId: null,
  mapFilters: {
    pathId: "all",
    endingId: "all",
  },
  pathFilters: {
    query: "",
    status: "all",
  },
  dashboardTab: "paths",
  pathDetailTab: "history",
};

const statusLabels = {
  in_progress: "In progress",
  reached_ending: "Reached ending",
  completed: "Completed",
  draft: "Draft",
  abandoned: "Abandoned",
};

const statusDescriptions = {
  in_progress: "You are still reading this route.",
  reached_ending: "This path is linked to one of the numbered endings.",
  completed: "This route is finished, but no numbered ending is linked.",
  draft: "A saved branch you can resume later.",
  abandoned: "A route you stopped and do not plan to continue now.",
};

const elements = {
  appTitle: document.querySelector("#appTitle"),
  themeToggle: document.querySelector("#themeToggle"),
  themeToggleText: document.querySelector("#themeToggleText"),
  openGuide: document.querySelector("#openGuide"),
  guideDialog: document.querySelector("#guideDialog"),
  bookListView: document.querySelector("#bookListView"),
  bookDashboardView: document.querySelector("#bookDashboardView"),
  pathDetailView: document.querySelector("#pathDetailView"),
  mapView: document.querySelector("#mapView"),
  bookGrid: document.querySelector("#bookGrid"),
  progressPanel: document.querySelector("#progressPanel"),
  pathList: document.querySelector("#pathList"),
  dashboardTabs: document.querySelectorAll("[data-dashboard-tab]"),
  dashboardTabPanels: document.querySelectorAll(".dashboard-tab-panel"),
  pathDetailTabs: document.querySelectorAll("[data-path-tab]"),
  pathDetailTabPanels: document.querySelectorAll(".path-detail-tab-panel"),
  pinnedPathPanel: document.querySelector("#pinnedPathPanel"),
  pathSearch: document.querySelector("#pathSearch"),
  pathStatusFilter: document.querySelector("#pathStatusFilter"),
  statusGuide: document.querySelector("#statusGuide"),
  endingGrid: document.querySelector("#endingGrid"),
  dashboardHeading: document.querySelector("#dashboardHeading"),
  pathDetailHeading: document.querySelector("#pathDetailHeading"),
  mapHeading: document.querySelector("#mapHeading"),
  mapSummary: document.querySelector("#mapSummary"),
  mapPathFilter: document.querySelector("#mapPathFilter"),
  mapEndingFilter: document.querySelector("#mapEndingFilter"),
  openHighlightedPath: document.querySelector("#openHighlightedPath"),
  pathMapCanvas: document.querySelector("#pathMapCanvas"),
  pathMeta: document.querySelector("#pathMeta"),
  stepTimeline: document.querySelector("#stepTimeline"),
  similarPaths: document.querySelector("#similarPaths"),
  toast: document.querySelector("#toast"),
  backToBooks: document.querySelector("#backToBooks"),
  backToDashboard: document.querySelector("#backToDashboard"),
  backFromMap: document.querySelector("#backFromMap"),
  openMapView: document.querySelector("#openMapView"),
  pinCurrentPath: document.querySelector("#pinCurrentPath"),
  openBookForm: document.querySelector("#openBookForm"),
  editBook: document.querySelector("#editBook"),
  deleteBook: document.querySelector("#deleteBook"),
  openPathForm: document.querySelector("#openPathForm"),
  editPathMeta: document.querySelector("#editPathMeta"),
  deletePath: document.querySelector("#deletePath"),
  exportData: document.querySelector("#exportData"),
  importData: document.querySelector("#importData"),
  importSampleData: document.querySelector("#importSampleData"),
  bookDialog: document.querySelector("#bookDialog"),
  bookForm: document.querySelector("#bookForm"),
  bookDialogTitle: document.querySelector("#bookDialogTitle"),
  bookTitle: document.querySelector("#bookTitle"),
  totalPaths: document.querySelector("#totalPaths"),
  totalEndings: document.querySelector("#totalEndings"),
  pathDialog: document.querySelector("#pathDialog"),
  pathForm: document.querySelector("#pathForm"),
  pathDialogTitle: document.querySelector("#pathDialogTitle"),
  pathName: document.querySelector("#pathName"),
  initialPathStatus: document.querySelector("#initialPathStatus"),
  initialPathStatusHint: document.querySelector("#initialPathStatusHint"),
  initialPathNotes: document.querySelector("#initialPathNotes"),
  endingPathDialog: document.querySelector("#endingPathDialog"),
  endingPathForm: document.querySelector("#endingPathForm"),
  endingPathDialogTitle: document.querySelector("#endingPathDialogTitle"),
  endingLinkedPaths: document.querySelector("#endingLinkedPaths"),
  endingPathChoices: document.querySelector("#endingPathChoices"),
  unmarkEndingButton: document.querySelector("#unmarkEndingButton"),
  stepForm: document.querySelector("#stepForm"),
  stepPage: document.querySelector("#stepPage"),
  chosenChoice: document.querySelector("#chosenChoice"),
  allChoices: document.querySelector("#allChoices"),
  createDrafts: document.querySelector("#createDrafts"),
  stepSubmitButton: document.querySelector("#stepSubmitButton"),
  cancelStepEdit: document.querySelector("#cancelStepEdit"),
  pathStatusForm: document.querySelector("#pathStatusForm"),
  pathStatus: document.querySelector("#pathStatus"),
  pathStatusHint: document.querySelector("#pathStatusHint"),
  reachedEnding: document.querySelector("#reachedEnding"),
  pathNotes: document.querySelector("#pathNotes"),
};

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return { books: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.books)) {
      throw new Error("Invalid data shape");
    }

    return normalizeData(parsed);
  } catch (error) {
    console.warn("Ending Tracker saved data could not be loaded.", error);
    showToast("Saved data looked corrupted, so a clean workspace was loaded.");
    return { books: [] };
  }
}

function normalizeData(data) {
  return {
    books: data.books.map((book) => ({
      id: book.id || uid("book"),
      title: book.title || "Untitled book",
      totalPaths: Number(book.totalPaths) || 0,
      totalEndings: Number(book.totalEndings) || 0,
      pinnedPathId: book.pinnedPathId || "",
      endings: Array.isArray(book.endings) ? book.endings : createEndings(book.totalEndings),
      paths: Array.isArray(book.paths) ? book.paths.map(normalizePath) : [],
    })),
  };
}

function normalizePath(path) {
  return {
    id: path.id || uid("path"),
    name: path.name || "Untitled path",
    status: statusLabels[path.status] ? path.status : "in_progress",
    reachedEndingId: path.reachedEndingId || "",
    notes: path.notes || "",
    createdAt: path.createdAt || nowIso(),
    updatedAt: path.updatedAt || nowIso(),
    parentPathId: path.parentPathId || "",
    draftFromStepIndex: Number.isInteger(path.draftFromStepIndex) ? path.draftFromStepIndex : null,
    draftBranchGroupId: path.draftBranchGroupId || "",
    draftChoiceIndex: Number.isInteger(path.draftChoiceIndex) ? path.draftChoiceIndex : null,
    steps: Array.isArray(path.steps) ? path.steps : [],
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  return savedTheme === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  elements.themeToggleText.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  elements.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  elements.themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  localStorage.setItem(THEME_KEY, theme);

  if (state.showingMap) {
    const book = getSelectedBook();
    if (book) renderMapView(book);
  }
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
}

function hasSeenGuide() {
  const cookieSeen = document.cookie
    .split(";")
    .map((item) => item.trim())
    .includes(`${GUIDE_COOKIE}=true`);

  return cookieSeen || localStorage.getItem(GUIDE_FALLBACK_KEY) === "true";
}

function markGuideSeen() {
  document.cookie = `${GUIDE_COOKIE}=true; max-age=31536000; path=/; SameSite=Lax`;
  localStorage.setItem(GUIDE_FALLBACK_KEY, "true");
}

function openGuideDialog({ markSeen = false } = {}) {
  if (markSeen) {
    markGuideSeen();
  }

  if (elements.guideDialog.open) return;
  elements.guideDialog.showModal();
  resetGuideScroll();
}

function resetGuideScroll() {
  const guideForm = elements.guideDialog.querySelector(".guide-form");

  guideForm?.focus({ preventScroll: true });
  elements.guideDialog.scrollTo({ top: 0, left: 0 });
  guideForm?.scrollTo({ top: 0, left: 0 });

  window.requestAnimationFrame(() => {
    elements.guideDialog.scrollTo({ top: 0, left: 0 });
    guideForm?.scrollTo({ top: 0, left: 0 });
  });
}

function showFirstRunGuide() {
  if (hasSeenGuide()) return;
  openGuideDialog({ markSeen: true });
}

function createEndings(totalEndings) {
  const count = Number(totalEndings) || 0;
  return Array.from({ length: count }, (_, index) => {
    const id = String(index + 1);
    return { id, label: `Ending ${id}`, reached: false };
  });
}

function createSampleEndings(totalEndings, reachedIds = []) {
  const reached = new Set(reachedIds.map(String));
  return createEndings(totalEndings).map((ending) => ({
    ...ending,
    reached: reached.has(ending.id),
  }));
}

function createSampleData() {
  return {
    books: [
      {
        id: "sample_book_house_of_paths",
        title: "House of Many Doors",
        totalPaths: 80,
        totalEndings: 31,
        pinnedPathId: "sample_path_red_door",
        endings: createSampleEndings(31, ["7", "12"]),
        paths: [
          {
            id: "sample_path_red_door",
            name: "Red Door Route",
            status: "reached_ending",
            reachedEndingId: "7",
            notes: "Main sample route with a completed ending.",
            createdAt: "2026-04-20T10:00:00.000Z",
            updatedAt: "2026-04-20T10:35:00.000Z",
            parentPathId: "",
            draftFromStepIndex: null,
            draftBranchGroupId: "",
            draftChoiceIndex: null,
            steps: [
              { type: "page", page: 1 },
              {
                type: "decision",
                page: 4,
                choice: "Open the red door",
                choices: ["Open the red door", "Open the blue door", "Stay in the hallway"],
                branchGroupId: "sample_branch_door_choice",
              },
              { type: "page", page: 18 },
              {
                type: "decision",
                page: 18,
                choice: "Fight",
                choices: ["Fight", "Run", "Talk"],
                branchGroupId: "sample_branch_encounter",
              },
              { type: "page", page: 42 },
            ],
          },
          {
            id: "sample_path_blue_door",
            name: "Red Door Route - Open the blue door",
            status: "in_progress",
            reachedEndingId: "",
            notes: "Branch created from the first door decision.",
            createdAt: "2026-04-20T10:05:00.000Z",
            updatedAt: "2026-04-20T10:20:00.000Z",
            parentPathId: "sample_path_red_door",
            draftFromStepIndex: 1,
            draftBranchGroupId: "sample_branch_door_choice",
            draftChoiceIndex: 0,
            steps: [
              { type: "page", page: 1 },
              {
                type: "decision",
                page: 4,
                choice: "Open the blue door",
                choices: ["Open the red door", "Open the blue door", "Stay in the hallway"],
                branchGroupId: "sample_branch_door_choice",
              },
              { type: "page", page: 11 },
            ],
          },
          {
            id: "sample_path_hallway",
            name: "Red Door Route - Stay in the hallway",
            status: "draft",
            reachedEndingId: "",
            notes: "Draft branch waiting to be continued.",
            createdAt: "2026-04-20T10:06:00.000Z",
            updatedAt: "2026-04-20T10:06:00.000Z",
            parentPathId: "sample_path_red_door",
            draftFromStepIndex: 1,
            draftBranchGroupId: "sample_branch_door_choice",
            draftChoiceIndex: 1,
            steps: [
              { type: "page", page: 1 },
              {
                type: "decision",
                page: 4,
                choice: "Stay in the hallway",
                choices: ["Open the red door", "Open the blue door", "Stay in the hallway"],
                branchGroupId: "sample_branch_door_choice",
              },
            ],
          },
          {
            id: "sample_path_talk",
            name: "Peaceful Talk Route",
            status: "reached_ending",
            reachedEndingId: "12",
            notes: "A second completed path to demonstrate shared endings and map highlights.",
            createdAt: "2026-04-20T11:00:00.000Z",
            updatedAt: "2026-04-20T11:25:00.000Z",
            parentPathId: "",
            draftFromStepIndex: null,
            draftBranchGroupId: "",
            draftChoiceIndex: null,
            steps: [
              { type: "page", page: 1 },
              {
                type: "decision",
                page: 4,
                choice: "Open the red door",
                choices: ["Open the red door", "Open the blue door", "Stay in the hallway"],
                branchGroupId: "sample_branch_door_choice",
              },
              { type: "page", page: 18 },
              {
                type: "decision",
                page: 18,
                choice: "Talk",
                choices: ["Fight", "Run", "Talk"],
                branchGroupId: "sample_branch_encounter",
              },
              { type: "page", page: 30 },
            ],
          },
        ],
      },
    ],
  };
}

function reconcileEndings(book, nextTotal) {
  const total = Number(nextTotal) || 0;
  const existing = new Map((book.endings || []).map((ending) => [String(ending.id), ending]));
  book.endings = Array.from({ length: total }, (_, index) => {
    const id = String(index + 1);
    return existing.get(id) || { id, label: `Ending ${id}`, reached: false };
  });
  book.totalEndings = total;
}

function getSelectedBook() {
  return state.data.books.find((book) => book.id === state.selectedBookId) || null;
}

function getSelectedPath() {
  const book = getSelectedBook();
  return book?.paths.find((path) => path.id === state.selectedPathId) || null;
}

function setView(viewName) {
  elements.bookListView.classList.toggle("active-view", viewName === "books");
  elements.bookDashboardView.classList.toggle("active-view", viewName === "dashboard");
  elements.pathDetailView.classList.toggle("active-view", viewName === "path");
  elements.mapView.classList.toggle("active-view", viewName === "map");
  elements.backToBooks.classList.toggle("hidden", viewName === "books");

  if (viewName === "books") {
    elements.appTitle.textContent = "Ending Tracker";
  }
}

function render() {
  const selectedBook = getSelectedBook();
  const selectedPath = getSelectedPath();

  if (!selectedBook) {
    setView("books");
    renderBooks();
    return;
  }

  elements.appTitle.textContent = selectedBook.title;

  if (state.showingMap) {
    setView("map");
    renderMapView(selectedBook);
    return;
  }

  if (selectedPath) {
    setView("path");
    renderPathDetail(selectedBook, selectedPath);
    return;
  }

  setView("dashboard");
  renderDashboard(selectedBook);
}

function renderBooks() {
  if (!state.data.books.length) {
    elements.bookGrid.innerHTML = emptyState("Add your first book to start tracking routes and endings.");
    return;
  }

  elements.bookGrid.innerHTML = state.data.books.map(renderBookCard).join("");
}

function renderBookCard(book) {
  const counts = getProgressCounts(book);
  const endingText = book.totalEndings ? `${counts.reachedEndings}/${book.totalEndings}` : counts.reachedEndings;
  const pathText = book.totalPaths ? `${book.paths.length}/${book.totalPaths}` : book.paths.length;

  return `
    <article class="book-card">
      <div class="card-title-row">
        <h3>${escapeHtml(book.title)}</h3>
        <span class="badge">${book.paths.length} paths</span>
      </div>
      <div class="metric-grid">
        <div class="mini-stat"><strong>${pathText}</strong><span>Paths discovered</span></div>
        <div class="mini-stat"><strong>${endingText}</strong><span>Endings reached</span></div>
      </div>
      <button class="primary-button" type="button" data-select-book="${book.id}">Open book</button>
    </article>
  `;
}

function renderDashboard(book) {
  elements.dashboardHeading.textContent = book.title;
  elements.progressPanel.innerHTML = renderProgress(book);
  elements.pathSearch.value = state.pathFilters.query;
  elements.pathStatusFilter.value = state.pathFilters.status;
  elements.statusGuide.innerHTML = renderStatusGuide();
  updateDashboardTabs();
  renderPathList(book);
  elements.endingGrid.innerHTML = book.endings.length
    ? book.endings.map(renderEndingButton).join("")
    : emptyState("Set an ending count to track numbered endings.");
}

function updateDashboardTabs() {
  elements.dashboardTabs.forEach((tab) => {
    const isActive = tab.dataset.dashboardTab === state.dashboardTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  elements.dashboardTabPanels.forEach((panel) => {
    const isActive = panel.id === `${state.dashboardTab}Panel`;
    panel.classList.toggle("active", isActive);
  });
}

function renderStatusGuide() {
  return Object.entries(statusLabels)
    .map(([status, label]) => `<p><strong>${label}:</strong> ${statusDescriptions[status]}</p>`)
    .join("");
}

function renderPathList(book) {
  const filteredPaths = getFilteredPaths(book);
  renderPinnedPath(book);

  if (!book.paths.length) {
    elements.pathList.innerHTML = emptyState("No paths yet. Create one when you begin reading.");
    return;
  }

  if (!filteredPaths.length) {
    elements.pathList.innerHTML = emptyState("No paths match the current filters.");
    return;
  }

  elements.pathList.innerHTML = filteredPaths.map((path) => renderPathCard(path, book)).join("");
}

function renderPinnedPath(book) {
  const pinnedPath = book.paths.find((path) => path.id === book.pinnedPathId);

  if (!pinnedPath) {
    if (book.pinnedPathId) {
      book.pinnedPathId = "";
      saveData();
    }
    elements.pinnedPathPanel.innerHTML = "";
    return;
  }

  elements.pinnedPathPanel.innerHTML = `
    <div class="pinned-path-card">
      <div>
        <p class="eyebrow">Currently following</p>
        <h3>${escapeHtml(pinnedPath.name)}</h3>
        <p>${pinnedPath.steps.length} saved steps - ${statusLabels[pinnedPath.status]}</p>
      </div>
      <div class="button-row">
        <button class="ghost-button" type="button" data-select-path="${pinnedPath.id}">Open</button>
        <button class="ghost-button" type="button" data-pin-path="${pinnedPath.id}">Unpin</button>
      </div>
    </div>
  `;
}

function getFilteredPaths(book) {
  const query = normalizeSearch(state.pathFilters.query);
  const status = state.pathFilters.status;

  return book.paths.filter((path) => {
    const matchesName = !query || normalizeSearch(path.name).includes(query);
    const matchesStatus = status === "all" || path.status === status;
    return matchesName && matchesStatus;
  });
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function renderProgress(book) {
  const counts = getProgressCounts(book);
  const endingPercent = book.totalEndings ? Math.round((counts.reachedEndings / book.totalEndings) * 100) : 0;
  const pathPercent = book.totalPaths ? Math.round((book.paths.length / book.totalPaths) * 100) : 0;

  return `
    <div class="metric-grid">
      <div class="metric">
        <strong>${book.totalPaths ? `${book.paths.length}/${book.totalPaths}` : book.paths.length}</strong>
        <span>Paths discovered</span>
      </div>
      <div class="metric">
        <strong>${book.totalEndings ? `${counts.reachedEndings}/${book.totalEndings}` : counts.reachedEndings}</strong>
        <span>Endings reached</span>
      </div>
      <div class="metric">
        <strong>${endingPercent}%</strong>
        <span>Ending completion</span>
      </div>
      <div class="metric">
        <strong>${counts.inProgress}</strong>
        <span>In progress</span>
      </div>
      <div class="metric">
        <strong>${counts.draft}</strong>
        <span>Draft branches</span>
      </div>
      <div class="metric">
        <strong>${counts.done}</strong>
        <span>Finished paths</span>
      </div>
    </div>
    <div class="progress-row">
      <div class="progress-label">
        <span>Ending completion</span>
        <strong>${endingPercent}%</strong>
      </div>
      <div class="progress-bar" aria-label="Ending completion">
        <div class="progress-fill" style="width: ${endingPercent}%"></div>
      </div>
    </div>
    <div class="progress-row">
      <div class="progress-label">
        <span>Path discovery</span>
        <strong>${pathPercent}%</strong>
      </div>
      <div class="progress-bar" aria-label="Path discovery">
        <div class="progress-fill" style="width: ${pathPercent}%"></div>
      </div>
    </div>
  `;
}

function getProgressCounts(book) {
  return {
    reachedEndings: book.endings.filter((ending) => ending.reached).length,
    inProgress: book.paths.filter((path) => path.status === "in_progress").length,
    draft: book.paths.filter((path) => path.status === "draft").length,
    done: book.paths.filter((path) => path.status === "completed" || path.status === "reached_ending").length,
    abandoned: book.paths.filter((path) => path.status === "abandoned").length,
  };
}

function renderPathCard(path, book = getSelectedBook()) {
  const lastStep = path.steps.at(-1);
  const endingText = path.reachedEndingId ? `Ending ${escapeHtml(path.reachedEndingId)}` : "No ending yet";
  const isPinned = book?.pinnedPathId === path.id;

  return `
    <article class="path-card ${isPinned ? "is-pinned" : ""}">
      <div class="card-title-row">
        <h3>${escapeHtml(path.name)}</h3>
        <div class="badge-row">
          ${isPinned ? '<span class="badge pinned">Pinned</span>' : ""}
          <span class="badge ${path.status}">${statusLabels[path.status]}</span>
        </div>
      </div>
      <p>${path.steps.length} saved steps - ${endingText}</p>
      <p>${lastStep ? escapeHtml(describeStep(lastStep)) : "Ready to begin."}</p>
      <div class="button-row path-card-actions">
        <button class="ghost-button" type="button" data-select-path="${path.id}">Open path</button>
        <button class="ghost-button" type="button" data-pin-path="${path.id}">${isPinned ? "Unpin" : "Pin"}</button>
      </div>
    </article>
  `;
}

function renderEndingButton(ending) {
  return `
    <button class="ending-button ${ending.reached ? "reached" : ""}" type="button" data-toggle-ending="${ending.id}" aria-pressed="${ending.reached}">
      ${escapeHtml(ending.id)}
    </button>
  `;
}

function renderPathDetail(book, path) {
  elements.pathDetailHeading.textContent = path.name;
  elements.pathMeta.textContent = `${statusLabels[path.status]} - ${path.steps.length} steps`;
  elements.pinCurrentPath.textContent = book.pinnedPathId === path.id ? "Unpin path" : "Pin path";
  updatePathDetailTabs();
  elements.stepTimeline.innerHTML = path.steps.length
    ? path.steps.map(renderStep).join("")
    : emptyState("No steps yet. Add the first page you read.");

  elements.pathStatus.value = path.status;
  elements.pathNotes.value = path.notes;
  updateStatusHints();
  syncStepEditorState();
  renderEndingSelect(book, path.reachedEndingId);
  elements.similarPaths.innerHTML = renderSimilarPaths(book, path);
}

function updatePathDetailTabs() {
  elements.pathDetailTabs.forEach((tab) => {
    const isActive = tab.dataset.pathTab === state.pathDetailTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  elements.pathDetailTabPanels.forEach((panel) => {
    const isActive = panel.id === `${state.pathDetailTab}Panel`;
    panel.classList.toggle("active", isActive);
  });
}

function renderEndingSelect(book, selectedEndingId) {
  const options = ['<option value="">No ending</option>']
    .concat(book.endings.map((ending) => `<option value="${ending.id}">${escapeHtml(ending.label)}</option>`))
    .join("");

  elements.reachedEnding.innerHTML = options;
  elements.reachedEnding.value = selectedEndingId || "";
}

function renderStep(step, index) {
  const icon = step.type === "decision" ? "?" : "#";
  return `
    <div class="timeline-item" draggable="true" data-step-index="${index}">
      <div class="timeline-icon" title="Drag to reorder">${icon}</div>
      <div class="timeline-content">
        <div class="timeline-head">
          <strong>${index + 1}. ${escapeHtml(describeStep(step))}</strong>
          <div class="step-actions">
            <button class="tiny-button" type="button" draggable="false" data-edit-step="${index}">Edit</button>
            <button class="tiny-button danger-text" type="button" draggable="false" data-delete-step="${index}">Remove</button>
          </div>
        </div>
        ${step.type === "decision" && step.choices?.length ? `<span>Options: ${escapeHtml(step.choices.join(", "))}</span>` : ""}
      </div>
    </div>
  `;
}

function renderSimilarPaths(book, currentPath) {
  const matches = book.paths
    .filter((path) => path.id !== currentPath.id)
    .map((path) => ({ path, score: getPrefixMatchScore(currentPath.steps, path.steps) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  if (!matches.length) {
    return emptyState("No similar paths found yet.");
  }

  return matches
    .map(
      ({ path, score }) => `
        <article class="path-card">
          <div class="card-title-row">
            <h3>${escapeHtml(path.name)}</h3>
            <span class="badge ${path.status}">${statusLabels[path.status]}</span>
          </div>
          <p>${score} matching early ${score === 1 ? "step" : "steps"}</p>
          <button class="ghost-button" type="button" data-select-path="${path.id}">Open</button>
        </article>
      `,
    )
    .join("");
}

function renderMapView(book) {
  elements.mapHeading.textContent = `${book.title} map`;
  syncMapControls(book);
  const graph = buildPathGraph(book);
  const highlightText = graph.hasHighlight ? " Highlighted connections are shown in orange." : "";
  elements.mapSummary.textContent = `${graph.pathCount} active ${graph.pathCount === 1 ? "path" : "paths"} shown. Abandoned paths are hidden.${highlightText}`;
  drawPathMap(graph);
}

function syncMapControls(book) {
  const activePaths = book.paths.filter((path) => path.status !== "abandoned");
  const reachedEndingIds = [...new Set(activePaths.map((path) => path.reachedEndingId).filter(Boolean))].sort(
    (a, b) => Number(a) - Number(b),
  );

  if (state.mapFilters.pathId !== "all" && !activePaths.some((path) => path.id === state.mapFilters.pathId)) {
    state.mapFilters.pathId = "all";
  }

  if (state.mapFilters.endingId !== "all" && !reachedEndingIds.includes(state.mapFilters.endingId)) {
    state.mapFilters.endingId = "all";
  }

  elements.mapPathFilter.innerHTML = ['<option value="all">All paths</option>']
    .concat(activePaths.map((path) => `<option value="${path.id}">${escapeHtml(path.name)}</option>`))
    .join("");
  elements.mapEndingFilter.innerHTML = ['<option value="all">All endings</option>']
    .concat(reachedEndingIds.map((endingId) => `<option value="${endingId}">Ending ${escapeHtml(endingId)}</option>`))
    .join("");
  elements.mapPathFilter.value = state.mapFilters.pathId;
  elements.mapEndingFilter.value = state.mapFilters.endingId;
  elements.openHighlightedPath.classList.toggle("hidden", state.mapFilters.pathId === "all");
}

function buildPathGraph(book) {
  const paths = book.paths.filter((path) => path.status !== "abandoned");
  const nodes = new Map();
  const edgeKeys = new Set();
  const edges = [];
  const highlightedPathIds = new Set();
  const highlightedEndingIds = new Set();

  paths.forEach((path) => {
    const pathEdgeKeys = [];
    const pathNodes = path.steps.map((step, index) => getMapNode(nodes, step, index));

    if (path.reachedEndingId) {
      pathNodes.push(
        getMapNode(
          nodes,
          { type: "ending", endingId: path.reachedEndingId, label: `Ending ${path.reachedEndingId}` },
          path.steps.length,
        ),
      );
    }

    for (let index = 0; index < pathNodes.length - 1; index += 1) {
      const from = pathNodes[index];
      const to = pathNodes[index + 1];
      const key = `${from.id}->${to.id}`;
      if (!edgeKeys.has(key)) {
        edgeKeys.add(key);
        edges.push({ key, from: from.id, to: to.id, pathIds: new Set(), endingIds: new Set() });
      }
      pathEdgeKeys.push(key);
      const edge = edges.find((item) => item.key === key);
      edge.pathIds.add(path.id);
      if (path.reachedEndingId) edge.endingIds.add(path.reachedEndingId);
    }

    if (state.mapFilters.pathId === path.id) {
      pathEdgeKeys.forEach((key) => highlightedPathIds.add(key));
    }

    if (state.mapFilters.endingId !== "all" && path.reachedEndingId === state.mapFilters.endingId) {
      pathEdgeKeys.forEach((key) => highlightedEndingIds.add(key));
    }
  });

  const groupedNodes = Array.from(nodes.values()).reduce((groups, node) => {
    if (!groups.has(node.depth)) groups.set(node.depth, []);
    groups.get(node.depth).push(node);
    return groups;
  }, new Map());

  return {
    nodes: Array.from(nodes.values()),
    edges,
    groupedNodes,
    pathCount: paths.length,
    hasHighlight: state.mapFilters.pathId !== "all" || state.mapFilters.endingId !== "all",
    highlightedEdgeKeys: new Set([...highlightedPathIds, ...highlightedEndingIds]),
  };
}

function getMapNode(nodes, step, depth) {
  const id = getMapNodeId(step);
  if (!nodes.has(id)) {
    nodes.set(id, {
      id,
      depth,
      label: getMapNodeLabel(step),
      type: step.type,
    });
  }

  const node = nodes.get(id);
  node.depth = Math.min(node.depth, depth);
  return node;
}

function getMapNodeId(step) {
  if (step.type === "ending") {
    return `ending:${step.endingId}`;
  }

  return stepSignature(step);
}

function getMapNodeLabel(step) {
  if (step.type === "ending") {
    return step.label;
  }

  return describeStep(step);
}

function drawPathMap(graph) {
  const canvas = elements.pathMapCanvas;
  const context = canvas.getContext("2d");
  const theme = getThemeColors();
  const depths = [...graph.groupedNodes.keys()].sort((a, b) => a - b);
  const maxRows = Math.max(1, ...Array.from(graph.groupedNodes.values()).map((group) => group.length));
  const cssWidth = Math.max(920, depths.length * 220 + 120);
  const cssHeight = Math.max(520, maxRows * 112 + 120);
  const ratio = window.devicePixelRatio || 1;

  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);
  context.fillStyle = theme.mapBg;
  context.fillRect(0, 0, cssWidth, cssHeight);

  if (!graph.nodes.length) {
    drawEmptyMap(context, cssWidth, cssHeight, theme);
    return;
  }

  positionMapNodes(graph, cssWidth);
  drawMapEdges(context, graph, theme);
  graph.nodes.forEach((node) => drawMapNode(context, node, graph, theme));
}

function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    mapBg: styles.getPropertyValue("--map-bg").trim() || "#fcfcfa",
    mapEdge: styles.getPropertyValue("--map-edge").trim() || "#aeb9b4",
    mapNode: styles.getPropertyValue("--map-node").trim() || "#ffffff",
    mapEnding: styles.getPropertyValue("--map-ending").trim() || "#eaf8f4",
    mapEmpty: styles.getPropertyValue("--map-empty").trim() || "#70787f",
    primary: styles.getPropertyValue("--primary").trim() || "#15967f",
    primaryDark: styles.getPropertyValue("--primary-dark").trim() || "#0f6f61",
    text: styles.getPropertyValue("--text").trim() || "#15191d",
    lineStrong: styles.getPropertyValue("--line-strong").trim() || "#cfd9d5",
  };
}

function positionMapNodes(graph) {
  const xSpacing = 220;
  const ySpacing = 112;
  const marginX = 70;
  const marginY = 70;

  [...graph.groupedNodes.keys()].sort((a, b) => a - b).forEach((depth, depthIndex) => {
    const group = graph.groupedNodes.get(depth).sort((a, b) => a.label.localeCompare(b.label));
    group.forEach((node, rowIndex) => {
      node.x = marginX + depthIndex * xSpacing;
      node.y = marginY + rowIndex * ySpacing;
    });
  });
}

function drawMapEdges(context, graph, theme) {
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  graph.edges.forEach((edge) => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) return;
    const isHighlighted = graph.highlightedEdgeKeys.has(edge.key);
    const isDimmed = graph.hasHighlight && !isHighlighted;
    const stroke = isHighlighted ? theme.primary : theme.mapEdge;
    const lineWidth = isHighlighted ? 4 : 2;
    const alpha = isDimmed ? 0.18 : 0.78;

    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = stroke;
    context.fillStyle = stroke;
    context.lineWidth = lineWidth;
    const start = { x: from.x + 82, y: from.y };
    const end = { x: to.x - 82, y: to.y };
    const controlA = { x: from.x + 140, y: from.y };
    const controlB = { x: to.x - 140, y: to.y };
    context.moveTo(start.x, start.y);
    context.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
    context.stroke();
    drawArrowHead(context, controlB, end, isHighlighted ? 12 : 9);
    context.restore();
  });
}

function drawArrowHead(context, control, end, size) {
  const angle = Math.atan2(end.y - control.y, end.x - control.x);

  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(end.x - size * Math.cos(angle - Math.PI / 6), end.y - size * Math.sin(angle - Math.PI / 6));
  context.lineTo(end.x - size * Math.cos(angle + Math.PI / 6), end.y - size * Math.sin(angle + Math.PI / 6));
  context.closePath();
  context.fill();
}

function drawMapNode(context, node, graph, theme) {
  const width = 164;
  const height = 54;
  const x = node.x - width / 2;
  const y = node.y - height / 2;
  const isEnding = node.type === "ending";
  const isHighlighted = isMapNodeHighlighted(node, graph);
  const isDimmed = graph.hasHighlight && !isHighlighted;

  context.save();
  context.globalAlpha = isDimmed ? 0.32 : 1;
  context.fillStyle = isEnding ? theme.mapEnding : theme.mapNode;
  context.strokeStyle = isHighlighted ? theme.primary : isEnding ? theme.primary : theme.lineStrong;
  context.lineWidth = isHighlighted ? 3 : 2;
  drawRoundRect(context, x, y, width, height, 8);
  context.fill();
  context.stroke();

  context.fillStyle = isEnding ? theme.primaryDark : theme.text;
  context.font = "700 12px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  wrapCanvasText(context, node.label, node.x, node.y, width - 18, 15);
  context.restore();
}

function isMapNodeHighlighted(node, graph) {
  if (!graph.hasHighlight) return true;

  return graph.edges.some(
    (edge) => graph.highlightedEdgeKeys.has(edge.key) && (edge.from === node.id || edge.to === node.id),
  );
}

function drawEmptyMap(context, width, height, theme) {
  context.fillStyle = theme.mapEmpty;
  context.font = "700 18px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("No active paths to visualize yet.", width / 2, height / 2);
}

function drawRoundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  lines.push(line);

  const visibleLines = lines.slice(0, 2);
  if (lines.length > 2) {
    visibleLines[1] = `${visibleLines[1].slice(0, 18)}...`;
  }

  const startY = y - ((visibleLines.length - 1) * lineHeight) / 2;
  visibleLines.forEach((visibleLine, index) => {
    context.fillText(visibleLine, x, startY + index * lineHeight);
  });
}

function getPrefixMatchScore(aSteps, bSteps) {
  let score = 0;
  const length = Math.min(aSteps.length, bSteps.length);

  for (let index = 0; index < length; index += 1) {
    if (stepSignature(aSteps[index]) !== stepSignature(bSteps[index])) {
      break;
    }
    score += 1;
  }

  return score;
}

function stepSignature(step) {
  if (!step) return "";
  if (step.type === "page") return `page:${step.page}`;
  return `decision:${step.page}:${String(step.choice || "").trim().toLowerCase()}`;
}

function describeStep(step) {
  if (step.type === "page") {
    return `Page ${step.page}`;
  }

  return `Page ${step.page}: ${step.choice}`;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function openBookDialog(book = null) {
  state.editingBookId = book?.id || null;
  elements.bookDialogTitle.textContent = book ? "Edit book" : "Add book";
  elements.bookTitle.value = book?.title || "";
  elements.totalPaths.value = book?.totalPaths || "";
  elements.totalEndings.value = book?.totalEndings || "";
  elements.bookDialog.showModal();
}

function openPathDialog(path = null) {
  state.editingPathId = path?.id || null;
  elements.pathDialogTitle.textContent = path ? "Edit path" : "New path";
  elements.pathName.value = path?.name || "";
  elements.initialPathStatus.value = path?.status || "in_progress";
  updateStatusHints();
  elements.initialPathNotes.value = path?.notes || "";
  elements.pathDialog.showModal();
}

function openEndingPathDialog(endingId) {
  const book = getSelectedBook();
  if (!book) return;

  if (!book.paths.length) {
    showToast("Create a path before marking an ending from the dashboard.");
    return;
  }

  const ending = book.endings.find((item) => item.id === endingId);
  const linkedPaths = book.paths.filter((path) => path.reachedEndingId === endingId);
  const availablePaths = book.paths.filter((path) => !path.reachedEndingId);

  state.pendingEndingId = endingId;
  elements.endingPathDialogTitle.textContent = `Link Ending ${endingId} to a path`;
  elements.endingLinkedPaths.innerHTML = linkedPaths.length
    ? linkedPaths.map((path) => `<div class="compact-list-item">${escapeHtml(path.name)}</div>`).join("")
    : emptyState("No paths are linked to this ending yet.");
  elements.endingPathChoices.innerHTML = availablePaths.length
    ? availablePaths.map(renderEndingPathChoice).join("")
    : emptyState("No unlinked paths are available.");
  elements.unmarkEndingButton.classList.toggle("hidden", !ending?.reached);
  elements.endingPathDialog.showModal();
}

function renderEndingPathChoice(path) {
  return `
    <label class="checkbox-line choice-item">
      <input type="checkbox" name="endingPathIds" value="${path.id}" />
      <span>${escapeHtml(path.name)} <small>${statusLabels[path.status]}</small></span>
    </label>
  `;
}

function handleBookSubmit(event) {
  event.preventDefault();
  const title = elements.bookTitle.value.trim();
  const totalPaths = Number(elements.totalPaths.value) || 0;
  const totalEndings = Number(elements.totalEndings.value) || 0;

  if (!title) return;

  if (state.editingBookId) {
    const book = state.data.books.find((item) => item.id === state.editingBookId);
    if (book) {
      book.title = title;
      book.totalPaths = totalPaths;
      reconcileEndings(book, totalEndings);
    }
  } else {
    const book = {
      id: uid("book"),
      title,
      totalPaths,
      totalEndings,
      pinnedPathId: "",
      endings: createEndings(totalEndings),
      paths: [],
    };
    state.data.books.push(book);
    state.selectedBookId = book.id;
  }

  saveData();
  elements.bookDialog.close();
  render();
  showToast("Book saved.");
}

function handlePathSubmit(event) {
  event.preventDefault();
  const book = getSelectedBook();
  if (!book) return;

  const name = elements.pathName.value.trim() || `Path ${book.paths.length + 1}`;
  const status = elements.initialPathStatus.value;
  const notes = elements.initialPathNotes.value.trim();

  if (state.editingPathId) {
    const path = book.paths.find((item) => item.id === state.editingPathId);
    if (path) {
      path.name = name;
      path.status = status;
      path.notes = notes;
      path.updatedAt = nowIso();
    }
  } else {
    const path = {
      id: uid("path"),
      name,
      status,
      reachedEndingId: "",
      notes,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      parentPathId: "",
      draftFromStepIndex: null,
      draftBranchGroupId: "",
      draftChoiceIndex: null,
      steps: [],
    };
    book.paths.unshift(path);
    state.selectedPathId = path.id;
    state.pathDetailTab = "continue";
  }

  saveData();
  elements.pathDialog.close();
  render();
  showToast("Path saved.");
}

function handleStepSubmit(event) {
  event.preventDefault();
  const book = getSelectedBook();
  const path = getSelectedPath();
  if (!book || !path) return;

  const step = getStepFormValue();
  if (!step) return;

  const wasEditing = state.editingStepIndex !== null;
  if (state.editingStepIndex !== null) {
    const oldStep = path.steps[state.editingStepIndex];
    const confirmed = confirmStepEdit(book, path, state.editingStepIndex, oldStep);
    if (!confirmed) return;

    if (oldStep?.type === "decision" && step.type === "decision") {
      step.branchGroupId = oldStep.branchGroupId || uid("branch");
    }
    path.steps[state.editingStepIndex] = step;
    cascadeBranchStepEdit(book, path, state.editingStepIndex, oldStep, step);
    state.editingStepIndex = null;
  } else if (step.type === "page") {
    path.steps.push(step);
  } else {
    step.branchGroupId = uid("branch");
    path.steps.push(step);

    if (elements.createDrafts.checked) {
      createDraftPaths(book, path, step, step.choices);
    }
  }

  path.status = path.status === "draft" ? "in_progress" : path.status;
  path.updatedAt = nowIso();
  saveData();
  resetStepForm();
  render();
  showToast(wasEditing ? "Step updated." : "Step added.");
}

function confirmStepEdit(book, path, stepIndex, oldStep) {
  if (oldStep?.type !== "decision") {
    return window.confirm("Save changes to this step?");
  }

  const branchGroupId = oldStep.branchGroupId || "";
  const linkedBranches = findBranchesFromStep(book, path, stepIndex, branchGroupId);
  const branchText = linkedBranches.length
    ? ` This will also update ${linkedBranches.length} linked branch ${linkedBranches.length === 1 ? "path" : "paths"}.`
    : "";

  return window.confirm(`Save changes to this decision step?${branchText}`);
}

function getStepFormValue() {
  const page = Number(elements.stepPage.value);
  const stepType = new FormData(elements.stepForm).get("stepType");

  if (!page) {
    showToast("Add a page number first.");
    return null;
  }

  if (stepType === "page") {
    return { type: "page", page };
  }

  const chosen = elements.chosenChoice.value.trim();
  if (!chosen) {
    showToast("Add the chosen decision.");
    return null;
  }

  return { type: "decision", page, choice: chosen, choices: collectChoices(chosen) };
}

function collectChoices(chosen) {
  const typedChoices = elements.allChoices.value
    .split(/\r?\n/)
    .map((choice) => choice.trim())
    .filter(Boolean);
  return uniqueChoices([chosen, ...typedChoices]);
}

function uniqueChoices(choices) {
  const seen = new Set();

  return choices.filter((choice) => {
    const key = normalizeChoice(choice);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeChoice(choice) {
  return String(choice || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function startStepEdit(index) {
  const path = getSelectedPath();
  const step = path?.steps[index];
  if (!step) return;

  state.editingStepIndex = index;
  document.querySelector(`input[name="stepType"][value="${step.type}"]`).checked = true;
  elements.stepPage.value = step.page || "";
  elements.chosenChoice.value = step.type === "decision" ? step.choice || "" : "";
  elements.allChoices.value = step.type === "decision" && Array.isArray(step.choices) ? step.choices.join("\n") : "";
  toggleDecisionFields();
  syncStepEditorState();
  elements.stepPage.focus();
}

function deleteStep(index) {
  const book = getSelectedBook();
  const path = getSelectedPath();
  if (!path?.steps[index]) return;

  const step = path.steps[index];
  const linkedBranches = step.type === "decision" && book
    ? findBranchesFromStep(book, path, index, step.branchGroupId || "")
    : [];
  const message = linkedBranches.length
    ? `Remove this decision step and delete ${linkedBranches.length} linked branch ${linkedBranches.length === 1 ? "path" : "paths"}?`
    : "Remove this step from the path?";
  const confirmed = window.confirm(message);
  if (!confirmed) return;

  if (book && linkedBranches.length) {
    const linkedBranchIds = new Set(linkedBranches.map((branch) => branch.id));
    book.paths = book.paths.filter((branchPath) => !linkedBranchIds.has(branchPath.id));
  }

  path.steps.splice(index, 1);
  path.updatedAt = nowIso();
  if (state.editingStepIndex === index) {
    resetStepForm();
  } else if (state.editingStepIndex !== null && state.editingStepIndex > index) {
    state.editingStepIndex -= 1;
  }

  saveData();
  render();
  showToast("Step removed.");
}

function moveStep(fromIndex, toIndex) {
  const book = getSelectedBook();
  const path = getSelectedPath();
  if (!book || !path || fromIndex === toIndex) return;
  if (!path.steps[fromIndex] || !path.steps[toIndex]) return;

  ensureBranchReferencesForSourcePath(book, path);
  const oldSteps = path.steps.map(cloneStep);
  const linkedBranches = findBranchesForSourcePath(book, path);
  const branchText = linkedBranches.length
    ? ` This will also update ${linkedBranches.length} linked branch ${linkedBranches.length === 1 ? "path" : "paths"}.`
    : "";
  const confirmed = window.confirm(`Move this step to a new position?${branchText}`);
  if (!confirmed) {
    render();
    return;
  }

  const [movedStep] = path.steps.splice(fromIndex, 1);
  path.steps.splice(toIndex, 0, movedStep);
  path.updatedAt = nowIso();
  updateBranchesAfterStepReorder(book, path, oldSteps);
  state.editingStepIndex = null;
  saveData();
  render();
  showToast("Step moved.");
}

function resetStepForm() {
  state.editingStepIndex = null;
  elements.stepForm.reset();
  document.querySelector('input[name="stepType"][value="page"]').checked = true;
  toggleDecisionFields();
  syncStepEditorState();
}

function syncStepEditorState() {
  const isEditing = state.editingStepIndex !== null;
  elements.stepSubmitButton.textContent = isEditing ? "Save step" : "Add step";
  elements.cancelStepEdit.classList.toggle("hidden", !isEditing);
  elements.createDrafts.disabled = isEditing;
}

function ensureBranchReferencesForSourcePath(book, sourcePath) {
  findBranchesForSourcePath(book, sourcePath).forEach((branch) => {
    const index = branch.draftFromStepIndex;
    const sourceStep = Number.isInteger(index) ? sourcePath.steps[index] : null;
    const branchStep = Number.isInteger(index) ? branch.steps[index] : null;

    if (!sourceStep || sourceStep.type !== "decision") {
      return;
    }

    sourceStep.branchGroupId = sourceStep.branchGroupId || branch.draftBranchGroupId || uid("branch");
    branch.draftBranchGroupId = sourceStep.branchGroupId;

    if (!Number.isInteger(branch.draftChoiceIndex)) {
      branch.draftChoiceIndex = resolveBranchChoiceIndex(branch, branchStep, getAlternateChoices(sourceStep));
    }
  });
}

function findBranchesForSourcePath(book, sourcePath) {
  return book.paths.filter((path) => path.id !== sourcePath.id && path.parentPathId === sourcePath.id);
}

function updateBranchesAfterStepReorder(book, sourcePath, oldSteps) {
  findBranchesForSourcePath(book, sourcePath).forEach((branch) => {
    const branchGroupId = branch.draftBranchGroupId;
    if (!branchGroupId) return;

    const newIndex = sourcePath.steps.findIndex((step) => step.type === "decision" && step.branchGroupId === branchGroupId);
    if (newIndex < 0) return;

    const sourceDecision = sourcePath.steps[newIndex];
    const oldIndex = Number.isInteger(branch.draftFromStepIndex) ? branch.draftFromStepIndex : newIndex;
    const branchStepIndex = findBranchStepIndex(branch, branchGroupId, oldIndex);
    const branchStep = branch.steps[branchStepIndex] || branch.steps[oldIndex];
    const oldSourceStep = oldSteps[oldIndex];
    const choiceIndex = resolveBranchChoiceIndex(branch, branchStep, getAlternateChoices(oldSourceStep || sourceDecision));
    const nextChoice = getAlternateChoices(sourceDecision)[choiceIndex] ?? branchStep?.choice ?? sourceDecision.choice;
    const suffixStart = branchStepIndex >= 0 ? branchStepIndex + 1 : oldIndex + 1;
    const suffix = branch.steps.slice(suffixStart).map(cloneStep);
    const nextBranchStep = {
      ...cloneStep(sourceDecision),
      choice: nextChoice,
      choices: [...(sourceDecision.choices || [])],
    };

    branch.steps = [
      ...sourcePath.steps.slice(0, newIndex).map(cloneStep),
      nextBranchStep,
      ...suffix,
    ];
    branch.draftFromStepIndex = newIndex;
    branch.draftChoiceIndex = choiceIndex;
    branch.updatedAt = nowIso();
  });
}

function findBranchStepIndex(branch, branchGroupId, fallbackIndex) {
  const matchedIndex = branch.steps.findIndex((step) => step.type === "decision" && step.branchGroupId === branchGroupId);
  return matchedIndex >= 0 ? matchedIndex : fallbackIndex;
}

function cloneStep(step) {
  if (!step) return step;
  return {
    ...step,
    choices: Array.isArray(step.choices) ? [...step.choices] : step.choices,
  };
}

function cascadeBranchStepEdit(book, sourcePath, stepIndex, oldStep, newStep) {
  if (oldStep?.type !== "decision") {
    return;
  }

  if (!oldStep.branchGroupId) {
    oldStep.branchGroupId = newStep.branchGroupId || uid("branch");
  }

  if (newStep.type !== "decision") {
    updateExistingBranches(book, sourcePath, stepIndex, oldStep, newStep, []);
    return;
  }

  newStep.branchGroupId = newStep.branchGroupId || oldStep.branchGroupId;
  const newAlternateChoices = getAlternateChoices(newStep);
  const existingBranches = updateExistingBranches(book, sourcePath, stepIndex, oldStep, newStep, newAlternateChoices);
  createMissingBranchesForChoices(book, sourcePath, stepIndex, newStep, newAlternateChoices, existingBranches);
}

function updateExistingBranches(book, sourcePath, stepIndex, oldStep, newStep, newAlternateChoices) {
  const branches = findBranchesFromStep(book, sourcePath, stepIndex, oldStep.branchGroupId);
  const oldAlternateChoices = getAlternateChoices(oldStep);

  branches.forEach((branch) => {
    const oldBranchStep = branch.steps[stepIndex];
    const oldChoiceIndex = resolveBranchChoiceIndex(branch, oldBranchStep, oldAlternateChoices);
    const nextChoice = newAlternateChoices[oldChoiceIndex] ?? oldBranchStep?.choice;

    if (newStep.type === "decision") {
      branch.steps[stepIndex] = {
        ...newStep,
        choice: nextChoice,
        choices: newStep.choices,
      };
      updateGeneratedBranchName(branch, sourcePath, oldBranchStep?.choice, nextChoice);
      branch.draftBranchGroupId = newStep.branchGroupId;
      branch.draftChoiceIndex = oldChoiceIndex;
    } else {
      branch.steps[stepIndex] = { type: "page", page: newStep.page };
    }

    branch.updatedAt = nowIso();
  });

  return branches;
}

function createMissingBranchesForChoices(book, sourcePath, stepIndex, newStep, newAlternateChoices, existingBranches) {
  const existingChoiceIndexes = new Set(
    existingBranches
      .map((branch) => branch.draftChoiceIndex)
      .filter((choiceIndex) => Number.isInteger(choiceIndex)),
  );

  newAlternateChoices.forEach((choice, choiceIndex) => {
    if (existingChoiceIndexes.has(choiceIndex)) {
      return;
    }

    const inheritedSteps = sourcePath.steps.slice(0, stepIndex);
    const draftStep = { ...newStep, choice, choices: newStep.choices };
    book.paths.unshift(buildBranchPath(sourcePath, inheritedSteps, draftStep, stepIndex, choiceIndex));
  });
}

function findBranchesFromStep(book, sourcePath, stepIndex, branchGroupId) {
  return book.paths.filter((path) => {
    if (path.id === sourcePath.id || path.parentPathId !== sourcePath.id) {
      return false;
    }

    if (branchGroupId && path.draftBranchGroupId === branchGroupId) {
      return true;
    }

    return path.draftFromStepIndex === stepIndex;
  });
}

function getAlternateChoices(step) {
  const selectedChoice = normalizeChoice(step.choice);
  return (step.choices || []).filter((choice) => normalizeChoice(choice) !== selectedChoice);
}

function resolveBranchChoiceIndex(branch, branchStep, oldAlternateChoices) {
  if (Number.isInteger(branch.draftChoiceIndex)) {
    return branch.draftChoiceIndex;
  }

  const matchedIndex = oldAlternateChoices.findIndex((choice) => choice === branchStep?.choice);
  return matchedIndex >= 0 ? matchedIndex : 0;
}

function updateGeneratedBranchName(branch, sourcePath, oldChoice, nextChoice) {
  const oldGeneratedName = `${sourcePath.name} - ${oldChoice}`;

  if (!oldChoice || branch.name !== oldGeneratedName) {
    return;
  }

  branch.name = `${sourcePath.name} - ${nextChoice}`;
}

function createDraftPaths(book, sourcePath, decisionStep, choices) {
  const alternateChoices = getAlternateChoices({ ...decisionStep, choices });
  const inheritedSteps = sourcePath.steps.slice(0, -1);
  const draftIndex = sourcePath.steps.length - 1;

  alternateChoices.forEach((choice, choiceIndex) => {
    const draftStep = { ...decisionStep, choice, choices };
    book.paths.unshift(buildBranchPath(sourcePath, inheritedSteps, draftStep, draftIndex, choiceIndex));
  });
}

function buildBranchPath(sourcePath, inheritedSteps, draftStep, draftIndex, choiceIndex) {
  return {
    id: uid("path"),
    name: `${sourcePath.name} - ${draftStep.choice}`,
    status: "draft",
    reachedEndingId: "",
    notes: `Branch from ${sourcePath.name}`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    parentPathId: sourcePath.id,
    draftFromStepIndex: draftIndex,
    draftBranchGroupId: draftStep.branchGroupId || "",
    draftChoiceIndex: choiceIndex,
    steps: [...inheritedSteps, draftStep],
  };
}

function handlePathStatusSubmit(event) {
  event.preventDefault();
  const book = getSelectedBook();
  const path = getSelectedPath();
  if (!book || !path) return;

  path.status = elements.pathStatus.value;
  path.notes = elements.pathNotes.value.trim();
  path.reachedEndingId = elements.reachedEnding.value;

  if (path.reachedEndingId) {
    path.status = "reached_ending";
    markEnding(book, path.reachedEndingId, true);
  }

  path.updatedAt = nowIso();
  saveData();
  render();
  showToast("Path details saved.");
}

function handleEndingPathSubmit(event) {
  event.preventDefault();
  const book = getSelectedBook();
  const endingId = state.pendingEndingId;
  if (!book || !endingId) return;

  const selectedIds = Array.from(elements.endingPathForm.querySelectorAll('input[name="endingPathIds"]:checked')).map(
    (input) => input.value,
  );

  if (!selectedIds.length) {
    showToast("Select at least one unlinked path for this ending.");
    return;
  }

  const selectedPaths = book.paths.filter((path) => selectedIds.includes(path.id) && !path.reachedEndingId);
  selectedPaths.forEach((path) => {
    path.reachedEndingId = endingId;
    path.status = "reached_ending";
    path.updatedAt = nowIso();
  });
  markEnding(book, endingId, true);
  saveData();
  state.pendingEndingId = null;
  elements.endingPathDialog.close();
  render();
  showToast(`Ending ${endingId} linked to ${selectedPaths.length} ${selectedPaths.length === 1 ? "path" : "paths"}.`);
}

function toggleEndingFromDashboard(endingId) {
  const book = getSelectedBook();
  const ending = book?.endings.find((item) => item.id === endingId);
  if (!book || !ending) return;

  openEndingPathDialog(endingId);
}

function unmarkPendingEnding() {
  const book = getSelectedBook();
  const endingId = state.pendingEndingId;
  if (!book || !endingId) return;

  const linkedPaths = book.paths.filter((path) => path.reachedEndingId === endingId);
  const message = linkedPaths.length
    ? `Mark Ending ${endingId} as unreached and clear it from ${linkedPaths.length} linked ${linkedPaths.length === 1 ? "path" : "paths"}?`
    : `Mark Ending ${endingId} as unreached?`;
  const confirmed = window.confirm(message);
  if (!confirmed) return;

  linkedPaths.forEach((path) => {
    path.reachedEndingId = "";
    path.status = "completed";
    path.updatedAt = nowIso();
  });
  markEnding(book, endingId, false);
  saveData();
  state.pendingEndingId = null;
  elements.endingPathDialog.close();
  render();
  showToast(`Ending ${endingId} marked unreached.`);
}

function markEnding(book, endingId, reached) {
  const ending = book.endings.find((item) => item.id === endingId);
  if (ending) {
    ending.reached = reached;
  }
}

function togglePinnedPath(pathId) {
  const book = getSelectedBook();
  if (!book) return;

  const path = book.paths.find((item) => item.id === pathId);
  if (!path) return;

  const isPinned = book.pinnedPathId === pathId;
  book.pinnedPathId = isPinned ? "" : pathId;
  saveData();
  render();
  showToast(isPinned ? "Path unpinned." : `${path.name} pinned as current path.`);
}

function updateStatusHints() {
  if (elements.pathStatusHint) {
    elements.pathStatusHint.textContent = statusDescriptions[elements.pathStatus.value] || "";
  }

  if (elements.initialPathStatusHint) {
    elements.initialPathStatusHint.textContent = statusDescriptions[elements.initialPathStatus.value] || "";
  }
}

function toggleDecisionFields() {
  const stepType = new FormData(elements.stepForm).get("stepType");
  document.querySelectorAll(".decision-only").forEach((element) => {
    element.classList.toggle("hidden", stepType !== "decision");
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ending-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      if (!parsed || !Array.isArray(parsed.books)) {
        throw new Error("Invalid import format");
      }

      const replace = window.confirm("Importing will replace your current Ending Tracker data. Continue?");
      if (!replace) return;

    state.data = normalizeData(parsed);
    state.selectedBookId = state.data.books[0]?.id || null;
    state.selectedPathId = null;
    state.showingMap = false;
      saveData();
      render();
      showToast("Import complete.");
    } catch (error) {
      console.warn(error);
      showToast("That JSON file could not be imported.");
    } finally {
      elements.importData.value = "";
    }
  });
  reader.readAsText(file);
}

function importSampleData() {
  const replace = !state.data.books.length || window.confirm("Importing sample data will replace your current Ending Tracker data. Continue?");
  if (!replace) return;

  state.data = normalizeData(createSampleData());
  state.selectedBookId = state.data.books[0]?.id || null;
  state.selectedPathId = null;
  state.showingMap = false;
  state.pathFilters = { query: "", status: "all" };
  state.mapFilters = { pathId: "all", endingId: "all" };
  saveData();
  render();
  showToast("Sample data imported.");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

let toastTimer = null;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2600);
}

function addEventListeners() {
  elements.themeToggle.addEventListener("click", toggleTheme);
  elements.openGuide.addEventListener("click", () => openGuideDialog());
  elements.openBookForm.addEventListener("click", () => openBookDialog());
  elements.editBook.addEventListener("click", () => openBookDialog(getSelectedBook()));
  elements.openPathForm.addEventListener("click", () => openPathDialog());
  elements.editPathMeta.addEventListener("click", () => openPathDialog(getSelectedPath()));
  elements.bookForm.addEventListener("submit", handleBookSubmit);
  elements.pathForm.addEventListener("submit", handlePathSubmit);
  elements.stepForm.addEventListener("submit", handleStepSubmit);
  elements.cancelStepEdit.addEventListener("click", resetStepForm);
  elements.pathStatusForm.addEventListener("submit", handlePathStatusSubmit);
  elements.endingPathForm.addEventListener("submit", handleEndingPathSubmit);
  elements.unmarkEndingButton.addEventListener("click", unmarkPendingEnding);
  elements.endingPathDialog.addEventListener("close", () => {
    state.pendingEndingId = null;
  });
  elements.exportData.addEventListener("click", exportData);
  elements.importData.addEventListener("change", importData);
  elements.importSampleData.addEventListener("click", importSampleData);
  elements.pathSearch.addEventListener("input", () => {
    state.pathFilters.query = elements.pathSearch.value;
    const book = getSelectedBook();
    if (book) renderPathList(book);
  });
  elements.pathStatusFilter.addEventListener("change", () => {
    state.pathFilters.status = elements.pathStatusFilter.value;
    const book = getSelectedBook();
    if (book) renderPathList(book);
  });
  elements.mapPathFilter.addEventListener("change", () => {
    state.mapFilters.pathId = elements.mapPathFilter.value;
    if (state.mapFilters.pathId !== "all") {
      state.mapFilters.endingId = "all";
    }
    const book = getSelectedBook();
    if (book) renderMapView(book);
  });
  elements.mapEndingFilter.addEventListener("change", () => {
    state.mapFilters.endingId = elements.mapEndingFilter.value;
    if (state.mapFilters.endingId !== "all") {
      state.mapFilters.pathId = "all";
    }
    const book = getSelectedBook();
    if (book) renderMapView(book);
  });
  elements.openHighlightedPath.addEventListener("click", () => {
    if (state.mapFilters.pathId === "all") return;
    state.selectedPathId = state.mapFilters.pathId;
    state.showingMap = false;
    render();
  });
  elements.pathStatus.addEventListener("change", updateStatusHints);
  elements.initialPathStatus.addEventListener("change", updateStatusHints);

  elements.backToBooks.addEventListener("click", () => {
    state.selectedBookId = null;
    state.selectedPathId = null;
    state.showingMap = false;
    state.editingStepIndex = null;
    render();
  });

  elements.backToDashboard.addEventListener("click", () => {
    state.selectedPathId = null;
    state.showingMap = false;
    state.editingStepIndex = null;
    render();
  });

  elements.openMapView.addEventListener("click", () => {
    state.selectedPathId = null;
    state.showingMap = true;
    render();
  });

  elements.backFromMap.addEventListener("click", () => {
    state.showingMap = false;
    render();
  });

  elements.pinCurrentPath.addEventListener("click", () => {
    const path = getSelectedPath();
    if (path) {
      togglePinnedPath(path.id);
    }
  });

  elements.deleteBook.addEventListener("click", () => {
    const book = getSelectedBook();
    if (!book) return;
    const confirmed = window.confirm(`Delete "${book.title}" and all saved paths?`);
    if (!confirmed) return;
    state.data.books = state.data.books.filter((item) => item.id !== book.id);
    state.selectedBookId = null;
    state.selectedPathId = null;
    state.showingMap = false;
    saveData();
    render();
    showToast("Book deleted.");
  });

  elements.deletePath.addEventListener("click", () => {
    const book = getSelectedBook();
    const path = getSelectedPath();
    if (!book || !path) return;
    const confirmed = window.confirm(`Delete "${path.name}"?`);
    if (!confirmed) return;
    book.paths = book.paths.filter((item) => item.id !== path.id);
    if (book.pinnedPathId === path.id) {
      book.pinnedPathId = "";
    }
    state.selectedPathId = null;
    saveData();
    render();
    showToast("Path deleted.");
  });

  document.addEventListener("click", (event) => {
    const bookButton = event.target.closest("[data-select-book]");
    const pathButton = event.target.closest("[data-select-path]");
    const pinPathButton = event.target.closest("[data-pin-path]");
    const endingButton = event.target.closest("[data-toggle-ending]");
    const dashboardTabButton = event.target.closest("[data-dashboard-tab]");
    const pathTabButton = event.target.closest("[data-path-tab]");
    const editStepButton = event.target.closest("[data-edit-step]");
    const deleteStepButton = event.target.closest("[data-delete-step]");
    const closeDialog = event.target.closest("[data-close-dialog]");

    if (dashboardTabButton) {
      state.dashboardTab = dashboardTabButton.dataset.dashboardTab;
      updateDashboardTabs();
    }

    if (pathTabButton) {
      state.pathDetailTab = pathTabButton.dataset.pathTab;
      updatePathDetailTabs();
    }

    if (bookButton) {
      state.selectedBookId = bookButton.dataset.selectBook;
      state.selectedPathId = null;
      state.showingMap = false;
      state.editingStepIndex = null;
      render();
    }

    if (pathButton) {
      state.selectedPathId = pathButton.dataset.selectPath;
      state.showingMap = false;
      state.editingStepIndex = null;
      state.pathDetailTab = "history";
      render();
    }

    if (pinPathButton) {
      togglePinnedPath(pinPathButton.dataset.pinPath);
    }

    if (endingButton) {
      toggleEndingFromDashboard(endingButton.dataset.toggleEnding);
    }

    if (editStepButton) {
      startStepEdit(Number(editStepButton.dataset.editStep));
    }

    if (deleteStepButton) {
      deleteStep(Number(deleteStepButton.dataset.deleteStep));
    }

    if (closeDialog) {
      if (closeDialog.closest("dialog") === elements.endingPathDialog) {
        state.pendingEndingId = null;
      }
      closeDialog.closest("dialog").close();
    }
  });

  elements.stepForm.addEventListener("change", toggleDecisionFields);
  elements.stepTimeline.addEventListener("dragstart", handleStepDragStart);
  elements.stepTimeline.addEventListener("dragover", handleStepDragOver);
  elements.stepTimeline.addEventListener("drop", handleStepDrop);
  elements.stepTimeline.addEventListener("dragend", handleStepDragEnd);
}

function handleStepDragStart(event) {
  const item = event.target.closest("[data-step-index]");
  if (!item) return;

  state.draggingStepIndex = Number(item.dataset.stepIndex);
  item.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", item.dataset.stepIndex);
}

function handleStepDragOver(event) {
  const item = event.target.closest("[data-step-index]");
  if (!item || state.draggingStepIndex === null) return;

  event.preventDefault();
  elements.stepTimeline.querySelectorAll(".drag-over").forEach((dropTarget) => {
    if (dropTarget !== item) {
      dropTarget.classList.remove("drag-over");
    }
  });
  item.classList.toggle("drag-over", Number(item.dataset.stepIndex) !== state.draggingStepIndex);
}

function handleStepDrop(event) {
  const item = event.target.closest("[data-step-index]");
  if (!item || state.draggingStepIndex === null) return;

  event.preventDefault();
  const toIndex = Number(item.dataset.stepIndex);
  const fromIndex = state.draggingStepIndex;
  state.draggingStepIndex = null;
  clearDragClasses();
  moveStep(fromIndex, toIndex);
}

function handleStepDragEnd() {
  state.draggingStepIndex = null;
  clearDragClasses();
}

function clearDragClasses() {
  elements.stepTimeline.querySelectorAll(".dragging, .drag-over").forEach((item) => {
    item.classList.remove("dragging", "drag-over");
  });
}

state.data = loadData();
addEventListeners();
applyTheme(loadTheme());
render();
window.requestAnimationFrame(showFirstRunGuide);
