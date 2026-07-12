/* Shared utilities: theme, progress tracking, bookmarks.
   All state lives in localStorage — nothing leaves the reader's browser. */

const Spines = (() => {
  const THEME_KEY = "spines:theme";
  const PROGRESS_KEY = "spines:progress"; // { [slug]: { lastChapter, chaptersRead: [], updatedAt } }
  const BOOKMARK_KEY = "spines:bookmarks"; // { [slug]: [{ chapterId, scrollPct, note, createdAt }] }
  const FONT_KEY = "spines:font-scale";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable — fail silently, reading still works */
    }
  }

  // ---------- Theme ----------
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || "dark";
  }
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }
  function initTheme() {
    setTheme(getTheme());
  }
  function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    return next;
  }

  // ---------- Progress ----------
  function getProgress(slug) {
    const all = readJSON(PROGRESS_KEY, {});
    return all[slug] || { lastChapter: null, chaptersRead: [], updatedAt: null };
  }
  function markChapterRead(slug, chapterId) {
    const all = readJSON(PROGRESS_KEY, {});
    const entry = all[slug] || { lastChapter: null, chaptersRead: [], updatedAt: null };
    if (!entry.chaptersRead.includes(chapterId)) entry.chaptersRead.push(chapterId);
    entry.lastChapter = chapterId;
    entry.updatedAt = Date.now();
    all[slug] = entry;
    writeJSON(PROGRESS_KEY, all);
  }
  function progressPct(slug, totalChapters) {
    const entry = getProgress(slug);
    if (!totalChapters) return 0;
    return Math.round((entry.chaptersRead.length / totalChapters) * 100);
  }

  // ---------- Bookmarks ----------
  function getBookmarks(slug) {
    const all = readJSON(BOOKMARK_KEY, {});
    return all[slug] || [];
  }
  function addBookmark(slug, chapterId, scrollPct, note) {
    const all = readJSON(BOOKMARK_KEY, {});
    const list = all[slug] || [];
    list.push({ chapterId, scrollPct, note: note || "", createdAt: Date.now() });
    all[slug] = list;
    writeJSON(BOOKMARK_KEY, all);
  }
  function removeBookmark(slug, index) {
    const all = readJSON(BOOKMARK_KEY, {});
    const list = all[slug] || [];
    list.splice(index, 1);
    all[slug] = list;
    writeJSON(BOOKMARK_KEY, all);
  }
  function hasBookmarks(slug) {
    return getBookmarks(slug).length > 0;
  }

  // ---------- Font scale (reader) ----------
  function getFontScale() {
    return parseFloat(localStorage.getItem(FONT_KEY) || "1");
  }
  function setFontScale(scale) {
    localStorage.setItem(FONT_KEY, String(scale));
  }

  // ---------- Data loading ----------
  async function loadBooks() {
    const res = await fetch(resolvePath("data/books.json"));
    if (!res.ok) throw new Error("Could not load books.json");
    return res.json();
  }
  async function loadChapterText(slug, file) {
    const res = await fetch(resolvePath(`books/${slug}/chapters/${file}`));
    if (!res.ok) throw new Error(`Could not load chapter: ${slug}/${file}`);
    return res.text();
  }

  // Resolve paths relative to the page regardless of subfolder depth.
  function resolvePath(p) {
    return p; // pages live at root; kept as a hook for future nesting
  }

  // Minimal markdown -> HTML (headings, paragraphs, bold/italic). No deps.
  function renderMarkdown(md) {
    const escapeHtml = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let paragraph = [];
    const flush = () => {
      if (paragraph.length) {
        let text = escapeHtml(paragraph.join(" "));
        text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
        text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
        html += `<p>${text}</p>\n`;
        paragraph = [];
      }
    };
    for (const raw of lines) {
      const line = raw.trim();
      if (line === "") { flush(); continue; }
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h) {
        flush();
        const level = h[1].length;
        html += `<h${level}>${escapeHtml(h[2])}</h${level}>\n`;
      } else {
        paragraph.push(line);
      }
    }
    flush();
    return html;
  }

  function slugParam() {
    return new URLSearchParams(window.location.search).get("slug");
  }
  function chapterParam() {
    return new URLSearchParams(window.location.search).get("chapter");
  }

  return {
    initTheme, toggleTheme, getTheme,
    getProgress, markChapterRead, progressPct,
    getBookmarks, addBookmark, removeBookmark, hasBookmarks,
    getFontScale, setFontScale,
    loadBooks, loadChapterText, renderMarkdown,
    slugParam, chapterParam,
  };
})();
