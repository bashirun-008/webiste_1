(async function () {
  Spines.initTheme();

  document.getElementById("theme-toggle").addEventListener("click", () => {
    Spines.toggleTheme();
  });

  const shelvesEl = document.getElementById("shelves");

  let books = [];
  try {
    books = await Spines.loadBooks();
  } catch (e) {
    shelvesEl.innerHTML = `
      <div class="empty-state">
        <h2>The shelf is empty</h2>
        <p>Couldn't load data/books.json. If you're opening this file directly in a browser,<br>
        run a local server instead (e.g. <code>npx serve</code>) — browsers block local file loads.</p>
      </div>`;
    return;
  }

  if (!books.length) {
    shelvesEl.innerHTML = `<div class="empty-state"><h2>No books yet</h2><p>Add entries to data/books.json to fill the shelf.</p></div>`;
    return;
  }

  // Group into shelves of 5
  const shelfSize = 5;
  const groups = [];
  for (let i = 0; i < books.length; i += shelfSize) groups.push(books.slice(i, i + shelfSize));

  shelvesEl.innerHTML = groups.map((group, gi) => {
    const spines = group.map((book) => {
      const pct = Spines.progressPct(book.slug, book.chapters.length);
      const bookmarked = Spines.hasBookmarks(book.slug);
      return `
        <a class="spine ${bookmarked ? "has-bookmark" : ""}" style="--spine-color:${book.accent}" href="book.html?slug=${encodeURIComponent(book.slug)}" title="${escapeAttr(book.title)}">
          <span class="spine-progress" style="--pct:${pct}%"></span>
          <span class="spine-ribbon"></span>
          <span class="spine-title">${escapeHtml(book.title)}</span>
        </a>`;
    }).join("");

    return `
      <div class="shelf-group">
        <div class="shelf-label">Shelf ${gi + 1}</div>
        <div class="shelf">${spines}</div>
      </div>`;
  }).join("");

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, "&quot;");
  }
})();
