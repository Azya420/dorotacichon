# Dorota Cichoń Architecture Portfolio

Static GitHub Pages website presenting the architecture portfolio as an interactive two-page flipbook.

## Required PDF file

Upload the optimized PDF file to the repository root and name it exactly:

```text
portfolio.pdf
```

The website loads this file in the browser and turns each PDF page into a book page. Two pages are displayed side by side.

## Structure

- `index.html` - main page layout
- `styles.css` - white-background visual design, responsive layout, flipbook styling
- `app.js` - PDF loading, flipbook logic, project navigation
- `portfolio.pdf` - optimized PDF generated from the original portfolio PDF

## Publishing

The site deploys through GitHub Pages using the workflow in `.github/workflows/pages.yml`.
