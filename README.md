# K MEANS AI Website

The public K MEANS AI site is a dependency-free static website published through GitHub Pages.

## Structure

- `index.html` is the home page.
- The remaining top-level HTML files are product, research, approach, and company pages.
- `assets/css/site.css` contains shared interaction, navigation, accessibility, and motion foundations.
- `assets/css/home.css` contains home-page layout and the holiday ornament presentation.
- `assets/css/pages.css` contains the shared layout system for interior pages.
- `assets/js/site-motion.js` contains shared navigation and progressive, reduced-motion-aware page animation behavior.
- `assets/js/evidence-pages.js` and `assets/css/evidence.css` paginate the research evidence brief without changing the shared page layout.
- `assets/js/home-holiday.js` enables the holiday treatment until **January 2, 2027 at 12:00 a.m. America/New_York (05:00 UTC)**, configured by `data-holiday-until` on the home-page visual. It loads before the ornament and snow scripts, handles pages left open at the cutoff, and restores the normal mobile layout. This is a fixed cutoff, not an annual recurrence.
- `assets/js/home-ornaments.js` adds two draggable holiday pendulums beside the home-page logo, with a brief arrival motion once per session, keyboard controls, and reduced-motion support. It uses no external runtime and sleeps when settled or out of view. Remove its script and the `holiday-ornaments` markup to retire the seasonal interaction.
- `assets/js/home-snow.js` adds sparse, continuous snowfall in front of the home-page logo, beneath the interactive ornaments. Tugging or nudging an ornament sends a brief gust through nearby flakes. The pause control remembers the visitor's choice for the session; reduced motion hides the snow, and animation pauses while the logo or page is out of view. Gusts honor these settings. At the seasonal cutoff, both effects stop and release their animation work and observers.

## Local Preview

From the repository root:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Validation

Run the dependency-free structural audit before publishing:

```sh
node scripts/audit-site.mjs
```

The audit verifies local links and fragments, responsive image references and intrinsic dimensions, heading and ARIA targets, canonical and social metadata, structured data, external-link safety, sitemap routes, and image file signatures.

## Updating the Evidence Brief

Keep research and incident summaries with primary-source links in `research.html`. Each `data-evidence-page` section holds two briefs; keep no more than eight active briefs, add new groups above older groups, and update the numbered navigation and its descriptive labels. Consolidate follow-ups instead of duplicating incidents. Move retired coverage to `research-archive.html`, retaining its source-review context. Preserve existing group and article IDs on the Research page as links to the archived coverage so bookmarks remain useful. Label report or assessment dates separately from incident dates, and update the sources-reviewed date only after reviewing the evidence alongside a substantive change.

The script derives the current page and counts from those sections. All briefs remain readable without JavaScript and when printing. Before publishing pagination changes, check direct group and article links, Back/Forward, keyboard focus, mobile layout, and the existing navigation dropdowns.

## Asset Guidelines

- Keep public assets close to their maximum rendered size while allowing for high-density screens.
- Use an extension that matches the asset's real file format.
- Add intrinsic `width` and `height` to every rendered image.
- Use responsive WebP sources in a `picture` element for large production images while retaining the original PNG fallback.
- Lazy-load images that are below the first viewport.
- Keep exploratory or source artwork out of production unless it is referenced by the site.
