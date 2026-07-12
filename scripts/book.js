(async function () {
  Spines.initTheme();
  document.getElementById("theme-toggle").addEventListener("click", () => Spines.toggleTheme());

  const contentEl = document.getElementById("content");
  const slug = Spines.slugParam();

  if (!slug) {
    contentEl.innerHTML = emptyState("No book selected", "Head back to the shelf and pick one.");
    return;
  }

  let books;
  try {
    books = await Spines.loadBooks();
  } catch (e) {
    contentEl.innerHTML = emptyState("Couldn't load the library", "Make sure you're running this through a local server, not opening the file directly.");
    return;
  }

  const book = books.find((b) => b.slug === slug);
  if (!book) {
    contentEl.innerHTML = emptyState("Book not found", `No entry for "${slug}" in data/books.json.`);
    return;
  }

  document.title = `${book.title} — Spines`;

  const progress = Spines.getProgress(slug);
  const pct = Spines.progressPct(slug, book.chapters.length);
  const continueChapter = progress.lastChapter
    ? book.chapters.find((c) => c.id === progress.lastChapter)
    : book.chapters[0];

  const initials = book.title.split(" ").slice(0, 3).join(" ");

  contentEl.innerHTML = `
    <div class="book-hero">
      <div class="book-cover" style="--spine-color:${book.accent}"><span>${escapeHtml(initials)}</span></div>
      <div>
        <div class="book-genre">${escapeHtml(book.genre || "")}</div>
        <h1>${escapeHtml(book.title)}</h1>
        <div class="book-author">by ${escapeHtml(book.author || "Unknown")}</div>
        <p class="book-desc">${escapeHtml(book.description || "")}</p>
        <a class="btn" href="reader.html?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(continueChapter.id)}">
          ${progress.lastChapter ? "Continue reading" : "Start reading"}
        </a>
        <div class="progress-bar-track"><div class="progress-bar-fill" style="--pct:${pct}%"></div></div>
        <div class="progress-label">${progress.chaptersRead.length} of ${book.chapters.length} chapters read</div>
      </div>
    </div>

    <div class="shelf-label">Chapters</div>
    <ul class="chapter-list">
      ${book.chapters.map((ch, i) => {
        const done = progress.chaptersRead.includes(ch.id);
        return `
          <li>
            <a class="chapter-link" href="reader.html?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(ch.id)}">
              <span><span class="chapter-num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(ch.title)}</span>
              <span class="chapter-status ${done ? "done" : ""}">${done ? "Read" : ""}</span>
            </a>
          </li>`;
      }).join("")}
    </ul>
  `;

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function emptyState(title, body) {
    return `<div class="empty-state"><h2>${title}</h2><p>${body}</p></div>`;
  }
})();
