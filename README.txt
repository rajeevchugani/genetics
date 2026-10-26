MONOHYBRID CROSS LAB - how to publish
=====================================
Folder contents
  index.html       the page students open
  css/style.css    the styling
  js/              the question engine and screens (keep the file names)
  single-file.html the same site in ONE file (use if a platform only accepts one HTML file)

Keep the folder structure exactly as it is. Open index.html in a browser to test it.
No server, login or database is needed, and nothing is saved about students.

Easy ways to publish
  1. GitHub Pages: create a repository, upload the contents of this folder, then
     Settings > Pages > deploy from the main branch. Share the link it gives you.
  2. Netlify Drop (app.netlify.com/drop): drag the whole folder onto the page.
  3. School website or LMS: upload the folder to your web space and link to index.html.
     If it only accepts a single file, upload single-file.html instead.

The page loads its fonts from Google Fonts. If a school network blocks them, the site
still works with plain system fonts.
