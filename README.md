# Spines

A small, self-contained website for hosting your 15 novels — bookshelf home page, per-book chapter lists, and a distraction-free reader with dark mode, adjustable text size, reading progress, and bookmarks. No backend, no build step, no database. Everything a reader does (progress, bookmarks, dark/light mode) is saved in their own browser via `localStorage`.

## 1. Try it locally

Browsers block plain `file://` pages from loading `fetch()` data, so run a tiny local server from this folder:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open the printed local address. You should see one shelf with a sample book, **Ashes of Tomorrow**, fully written with 3 chapters — read through it to see how the site behaves.

## 2. Add your 15 novels

Each book has two parts:

**A. An entry in `data/books.json`**

```json
{
  "slug": "your-book-slug",
  "title": "Your Book Title",
  "author": "Your Pen Name",
  "genre": "Sci-Fi",
  "description": "One or two sentences that pull a reader in.",
  "accent": "#C9A961",
  "chapters": [
    { "id": "ch01", "title": "Chapter 1: Arrival", "file": "01.md" },
    { "id": "ch02", "title": "Chapter 2", "file": "02.md" }
  ]
}
```

`slug` must be unique and URL-safe (lowercase, hyphens). `accent` is any hex color — it's used as the spine and cover color.

**B. A markdown file per chapter**

Put chapter text in `books/<slug>/chapters/<file>.md`, matching the `file` name you used in `books.json`. Plain Markdown:

```markdown
# Chapter 1: Arrival

Your first paragraph here.

Another paragraph. *Italics* and **bold** both work.
```

The site already has this scaffolded for all 15 books — 14 of them currently contain a placeholder chapter explaining what to do. Just replace the placeholder text and add more `.md` files + chapter entries as needed for each book's real chapter count.

### Fastest way to bulk-load 15 already-written novels

If each novel is currently one big text file, split it into chapters and drop the files into `books/<slug>/chapters/`, named `01.md`, `02.md`, etc. Any script or editor's find/replace works — you're just chopping on chapter breaks and adding a `# Chapter Title` line at the top of each file. Ask me and I can write that splitter for you if you paste a book in.

## 3. Customize

- Colors, fonts, and layout: `styles/main.css` (CSS variables at the top control the whole palette — separate light/dark sets).
- Site name and hero copy: `index.html`.
- Shelf grouping size (default 5 books per shelf): `scripts/library.js`, the `shelfSize` constant.

## 4. Deploy

**Vercel**
```bash
npm i -g vercel
vercel
```
No config needed — it's a static site, Vercel will detect it automatically.

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. Repo Settings → Pages → set source to the branch/root.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

That's it — no environment variables, no server, no database.

## How the data is structured

```
spines/
├── index.html          # bookshelf home page
├── book.html            # one book's description + chapter list
├── reader.html           # the actual reading view
├── data/
│   └── books.json        # metadata for all 15 books
├── books/
│   └── <slug>/chapters/*.md   # chapter text, one file each
├── styles/main.css
└── scripts/
    ├── app.js            # theme, progress, bookmarks, markdown renderer
    ├── library.js
    ├── book.js
    └── reader.js
```

Reading progress is marked automatically once a reader scrolls ~85% through a chapter. Bookmarks save the exact scroll position, so "resume" drops the reader back where they left off.
