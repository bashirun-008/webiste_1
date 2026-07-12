(async function () {
  Spines.initTheme();
  document.getElementById("theme-toggle").addEventListener("click", () => Spines.toggleTheme());

  const contentEl = document.getElementById("reader-content");
  const navEl = document.getElementById("reader-nav");
  const titleEl = document.getElementById("reader-title");
  const backLink = document.getElementById("back-link");
  const scrollFill = document.getElementById("scroll-fill");
  const bookmarkBtn = document.getElementById("bookmark-btn");

  const slug = Spines.slugParam();
  const chapterId = Spines.chapterParam();

  if (!slug || !chapterId) {
    contentEl.innerHTML = `<div class="empty-state"><h2>Nothing to read yet</h2><p>Go back to the shelf and pick a book.</p></div>`;
    return;
  }

  let books;
  try {
    books = await Spines.loadBooks();
  } catch (e) {
    contentEl.innerHTML = `<div class="empty-state"><h2>Couldn't load the library</h2><p>Run this through a local server rather than opening the file directly.</p></div>`;
    return;
  }

  const book = books.find((b) => b.slug === slug);
  if (!book) {
    contentEl.innerHTML = `<div class="empty-state"><h2>Book not found</h2></div>`;
    return;
  }
  backLink.href = `book.html?slug=${encodeURIComponent(slug)}`;
  titleEl.textContent = book.title;

  const idx = book.chapters.findIndex((c) => c.id === chapterId);
  const chapter = book.chapters[idx];
  if (!chapter) {
    contentEl.innerHTML = `<div class="empty-state"><h2>Chapter not found</h2></div>`;
    return;
  }
  document.title = `${chapter.title} — ${book.title}`;

  try {
    const md = await Spines.loadChapterText(slug, chapter.file);
    contentEl.innerHTML = Spines.renderMarkdown(md);
  } catch (e) {
    contentEl.innerHTML = `<div class="empty-state"><h2>Couldn't load this chapter</h2><p>Missing file: books/${slug}/chapters/${chapter.file}</p></div>`;
    return;
  }

  // ---------- Font size ----------
  const applyFont = () => contentEl.style.setProperty("--reader-size", `${1.15 * Spines.getFontScale()}rem`);
  applyFont();
  document.getElementById("font-up").addEventListener("click", () => {
    Spines.setFontScale(Math.min(1.6, Spines.getFontScale() + 0.1));
    applyFont();
  });
  document.getElementById("font-down").addEventListener("click", () => {
    Spines.setFontScale(Math.max(0.8, Spines.getFontScale() - 0.1));
    applyFont();
  });

  // ---------- Scroll progress + auto mark-as-read ----------
  let marked = false;
  function onScroll() {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 100;
    scrollFill.style.width = pct + "%";
    if (pct > 85 && !marked) {
      marked = true;
      Spines.markChapterRead(slug, chapter.id);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Resume scroll position if this chapter has a bookmark, otherwise start at top
  const bookmarks = Spines.getBookmarks(slug).filter((b) => b.chapterId === chapter.id);
  if (bookmarks.length) {
    const latest = bookmarks[bookmarks.length - 1];
    requestAnimationFrame(() => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, (latest.scrollPct / 100) * scrollable);
    });
  }

  // ---------- Bookmark button ----------
  bookmarkBtn.addEventListener("click", () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    Spines.addBookmark(slug, chapter.id, pct);
    bookmarkBtn.style.color = "var(--accent)";
    setTimeout(() => (bookmarkBtn.style.color = ""), 900);
  });

  // ---------- Prev / next nav ----------
  const prev = book.chapters[idx - 1];
  const next = book.chapters[idx + 1];
  navEl.innerHTML = `
    ${prev ? `<a class="btn btn-ghost" href="reader.html?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(prev.id)}">&larr; ${escapeHtml(prev.title)}</a>` : "<span></span>"}
    ${next ? `<a class="btn" href="reader.html?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(next.id)}">${escapeHtml(next.title)} &rarr;</a>` : `<a class="btn" href="book.html?slug=${encodeURIComponent(slug)}">Back to book</a>`}
  `;

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
