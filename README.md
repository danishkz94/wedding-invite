# Wedding invitation

A mobile-first, static invitation built with plain HTML, CSS, and JavaScript. The checked-in files run without installation, an API key, an account, or a backend. The intro uses GSAP, locally compiled Tailwind utilities, and the three supplied image layers. The existing verse, scratch card, carousel, countdown, venue, and closing sections remain in place.

GSAP 3.12.7 with ScrollTrigger, Swiper 11.2.10, and canvas-confetti 1.9.4 are pinned and vendored locally in `vendor/`. Keep that folder when publishing. Google Fonts and a configured Google map are the only external runtime services; local font fallbacks remain usable offline.

## Make it yours

Edit [invite-config.js](invite-config.js). All wedding-specific content lives there: couple names, invitation wording, date/time/timezone, verse, photos, venue, closing message, and theme. The couple names, ceremony date, verse, and venue are configured. Names and wording remain selectable HTML, never text baked into artwork.

### Themes

Set `theme` to one of these values:

- `royal-olive` (default): carved olive doors, antique gold, peach fabric, parchment, and pale peach roses.
- `ivory-garden`: ivory doors, champagne gold, cream fabric, sage foliage, and ivory flowers.
- `rose-romance`: dusty rose doors, muted burgundy text, blush fabric, warm ivory, and rose flowers.

Theme variables coordinate paper, typography colors, borders, controls, and scratch foil. The supplied green/peach intro images are shared by default; their baked-in colors are not recolored. Supply matching per-theme images through `artwork[theme]` to change those. Theme variables are in [styles.css](styles.css). Set `previewThemes: false` for the guest-facing invitation; `true` shows the small three-swatch preview control. Preview choices are not persisted and do not change the configured default.

### Music

The optional soundtrack is `audio/invite-song.mp3`. It starts from the guest's opening tap, loops, and can be paused or resumed with the music button after the entrance. Mobile browsers require that user gesture before playing audio. The current clip is about 28 seconds long.

### Date And Time

Set `couple.eventDate` to the ceremony timestamp with an explicit UTC offset, such as `2026-12-11T18:30:00+05:30`, and `couple.timeZone` to its IANA timezone, such as `Asia/Kolkata`. The offset must match the venue's daylight-saving offset on the wedding date. Set `dateIsSample: false` once confirmed.

The configured ceremony is Friday, December 11, 2026 at 6:30 PM India Standard Time. The countdown uses the absolute instant, not the guest's timezone; its date label is formatted with `Intl.DateTimeFormat` in `Asia/Kolkata`. Missing/invalid dates, absent offsets, and invalid/missing timezones show an explicit pending-date message rather than `NaN`. After the event, the configured `countdown.passedMessage` replaces the numbers. The clock uses the guest device's current time, so that device's clock must be correct.

`displayDate` and `displayTime` optionally override the scratch-card labels. Leave them empty or as `[PLACEHOLDER: ...]` to derive those labels from the timestamp and timezone. They do not change the countdown target. Set `dateIsSample` to `true` only when the configured date is still a sample.

### Verse And Venue

The configured verse is “وَخَلَقْنَاكُمْ أَزْوَاجًا” with the translation “And We created you in pairs” (Surah An-Naba, Verse 8). Arabic uses Amiri with `lang="ar"` and RTL layout. The verse placeholder notice disappears when Arabic text is supplied.

Set `venue.name`, `address`, and `note`. Optionally set `mapsQuery` to a precise place name, address, or latitude/longitude; otherwise `address` is used. A real location enables a lazy-loaded Google Maps preview. Tapping the map or the **Open in Maps** link opens the guest's default maps app: Apple Maps on Apple devices, the system maps chooser on Android, and Google Maps elsewhere. There is no API key. An unconfigured venue shows a confirmation notice and deliberately hides the map/links instead of searching Google for placeholder text. Google receives the query when its map preview loads; there is no tracking code in this invitation.

## Swap the photos

The carousel image list is `gallery.photos` in `invite-config.js`. Each entry has a local `src`, descriptive `alt` text, and a caption. Replace the files in `images/` or add your own local images and update the corresponding `src` paths.

All photos are lazy-loaded, have descriptive alt text, reserved aspect ratios, and visible captions. Missing files produce a labeled placeholder. Aim for 1000-1400px images, compressed JPEG/WebP, and a centered subject that tolerates portrait cropping.

### Artwork And Fonts

The current intro uses the supplied [door.png](door.png), [curtain.png](curtain.png), and [TajMahal.png](TajMahal.png), with the slow hinge swing and curved fabric gathering preserved. The satin image is warped with Canvas 2D and remains visible after opening. The old [curtainopen.png](curtainopen.png) is not loaded. The separate rendered Taj Mahal/floral illustration, raised floral borders, hero bouquets, and closing flower decoration have been removed from the page. Decorative flowers and gold motifs already baked into the new Taj Mahal image remain part of that unchanged asset.

The PNGs were supplied by the project owner. Their original generator, license, and redistribution rights have not been independently verified. The source files are unchanged. The large plaque baked into the door image is excluded from the material samples: each leaf uses its outer 25% damask region. The centered **circular seal** is 156px on mobile and 176px on desktop, with a domed highlight, inset bevels, a raised lower edge, layered cast shadows, and a selectable HTML label.

The provided Taj Mahal image is 1536x2752 pixels. It fills portrait frames with proportional `object-fit: cover`, anchored center-bottom so the building and pool remain in view without stretching. On short screens up to 500px high, it switches to `contain` to preserve the full artwork. The names remain selectable HTML over the image's clear central area. Changing the viewport recalculates image scaling automatically; the original pixels are never destructively resized.

### Image-Based Intro

The three relative paths live under `intro` in [invite-config.js](invite-config.js): `doorImage`, `curtainImage`, and `backgroundImage`. Optional `artwork[theme].doorImage`, `.closedCurtains`, and `.openBackdrop` override those defaults for a theme. `curtainOverlay` is not used; the same animated satin canvas remains as the permanent curtain frame.

The Tailwind container remains `max-w-md mx-auto h-screen relative overflow-hidden`, with a stable `100svh` height and a maximum width of 448px. The Taj Mahal image is z-10, textured fabric z-20, doors z-30, and the circular seal z-40. Door perspective is 1200px, with beveled frames and visible edge thickness. The source door's clean side samples are cover-fitted per leaf, without the oversized plaque.

As the curtains open, GSAP settles the background from a 1.045x scale and subtle skew while an SVG displacement filter decreases from 18px to zero. This creates a brief watercolor-like pixel morph, rather than a delayed fade or a replacement image. The effect applies only to the background, not the text. At completion, the same image node moves into the hero alongside the same curtain canvas; its transform/filter are cleared after reaching the final shape. Reduced motion, Skip/Escape, and fallback completion use the undistorted image immediately.

`createDrapery` caches a viewport-sized satin texture and warps horizontal image bands along the two-stage curved contour. The top stays pinned beneath a static scalloped pelmet, the waist gathers first, and the lower hem follows with a slight billow. Gold rope knots and two hanging tassels emerge on each side as the fabric gathers. Below the knots, the contour tapers naturally beyond the screen edges instead of flaring inward over the architecture. Fabric shadows give depth without WebGL or a cloth-physics dependency. The renderer is high-DPI aware (capped at 2x) and redraws only during motion, a theme update, or resizing. At completion, the same canvas and wrapper move into the hero at full opacity, with their final pixels and position intact. Canvas buffers are deliberately retained for the static opened frame, and ResizeObserver continues observing the hero. There is no final curtain fade, replacement image, or second curtain renderer.

| Time | GSAP animation |
| --- | --- |
| 0.0-0.35s | The circular seal gently shrinks to 0.96 and fades; interaction is disabled. |
| 0.2-2.6s | Doors rotate to -108/+108 degrees using the earlier 2.4-second `power2.inOut` hinge motion, without sideways translation. |
| Throughout | The decoded Taj Mahal image is already rendered at full opacity behind the fabric, without a delayed background fade. |
| 2.25-4.5s | The image gently morphs from displacement/zoom/skew to its undistorted final pixels using `sine.inOut`. |
| 2.3-4.1s | The textured fabric gathers along its upper/waist contour in 1.8 seconds. |
| 2.9-4.1s | The gold tiebacks start to appear only after the fabric is fully gathered, then fade in slowly. |
| 2.45-4.5s | The lower hems follow, then tuck outward beneath the knots. |
| 4.5s | The same image, fabric canvas, and existing HTML content move into the Taj Mahal hero without a position change; focus moves to the names and normal scrolling resumes. |

The slower 2.4-second door swing is preserved. The curtain gathering starts about 0.6 seconds earlier than the preceding version, shortening the time the closed curtain is visible after the doors begin to open, while keeping the curved, staggered fabric motion. The rectangular sliding-curtain timeline is not used.

All three images preload and decode before opening is enabled. Skip/Escape, reduced motion, and the animation watchdog settle the image and fabric into their final shapes and preserve them in the hero. Missing GSAP also opens immediately; image errors fall back to readable content instead of trapping the page. The source PNGs total approximately 24 MiB; optimized licensed exports are recommended before public deployment. Serve the page over HTTP/HTTPS, with same-origin images, so canvas texture sampling is permitted. Local `file://` security restrictions can bypass the enhancement. Source files are not modified by the app.

Fonts are served by [Google Fonts](https://fonts.google.com/), each under the SIL Open Font License 1.1:

- Great Vibes, script: [source and OFL](https://github.com/google/fonts/tree/main/ofl/greatvibes).
- Cormorant Garamond, serif: [source and OFL](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond).
- Amiri, Arabic: [source and OFL](https://github.com/google/fonts/tree/main/ofl/amiri).
- Manrope, small labels: [source and OFL](https://github.com/google/fonts/tree/main/ofl/manrope).

To self-host fonts, download licensed WOFF2 subsets and their OFL notices, add local `@font-face` declarations with `font-display: swap`, and remove the Google Fonts links. Font fallbacks are already provided.

### Library Sources And Licenses

- GSAP + ScrollTrigger 3.12.7: [upstream](https://github.com/greensock/GSAP/tree/3.12.7), [GSAP Standard License](https://gsap.com/standard-license/), not MIT. The package declares that license URL rather than bundling a separate license file; original distribution headers are retained. Review current terms before commercial redistribution or building a paid template service.
- Swiper 11.2.10: [upstream](https://github.com/nolimits4web/swiper/tree/v11.2.10), MIT; notice retained in [vendor/SWIPER-LICENSE.txt](vendor/SWIPER-LICENSE.txt).
- canvas-confetti 1.9.4: [upstream](https://github.com/catdad/canvas-confetti), ISC; notice retained in [vendor/CONFETTI-LICENSE.txt](vendor/CONFETTI-LICENSE.txt).
- Tailwind CSS + CLI 4.3.3: [upstream](https://github.com/tailwindlabs/tailwindcss), MIT; development-only CSS compiler, with the notice retained in [vendor/TAILWIND-LICENSE.txt](vendor/TAILWIND-LICENSE.txt).

The exact browser distributions were downloaded from `https://cdn.jsdelivr.net/npm/<package>@<version>/`. The app uses local copies, not CDN runtime scripts. No additional animation, canvas, or 3D framework is used.

## Preview locally

From the project folder, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` and tap **Tap to open**. Stop the local server with `Ctrl+C`. Use the HTTP preview for the full intro because browsers may block canvas sampling under `file://`.

To rebuild Tailwind utilities after changing utility classes:

```sh
npm ci
npm run build:css
```

[tailwind.css](tailwind.css) imports only Tailwind's theme and utilities, not its global preflight reset, to preserve the rest of the invitation. Commit the generated [vendor/tailwind.css](vendor/tailwind.css). Guests and GitHub Pages do not need Node.js; the checked-in CSS is served directly.

### Interaction And Accessibility Checks

- Entrance: Enter/Space opens the seal; **Skip opening** and Escape bypass it, even mid-animation. Focus stays in the opening dialog, then moves to the names. Background scrolling is locked only while the entrance is present. A completion watchdog releases it if the timeline stalls. If GSAP fails, opening is immediate; if JavaScript never starts, doors remain hidden and the page is not locked.
- Reduced motion: no door rotation, moving curtains, scroll transforms, slide transitions, or confetti. All content is visible without animation.
- Scratch: Pointer Events cover mouse, touch, and pen; only an interaction starting inside the heart erases. A separate high-DPI heart mask provides the denominator for the approximately 50% threshold. Erasing is clipped to the heart. Touch scrolling is suppressed only during an active scratch, not across the whole section. Release/cancel/blur restores ordinary interaction. Resize and preview-theme changes redraw normalized strokes without losing progress.
- Keyboard date reveal: Tab to **Reveal the date**, then Enter/Space. It announces the result and launches the same one-time celebration. Repeated activations cannot launch confetti again. The date remains selectable HTML.
- Carousel: swipe horizontally, use the arrow controls/dots, or focus the carousel and press Left/Right. Keyboard arrows are scoped to this gallery, not captured globally. Without Swiper, photos remain horizontally scrollable.

Browser checks covered all three presets at 375x667, 390x844, and 1440x1000; no horizontal page overflow; entrance/skip/reduced-motion states; synthetic pen scratching below/above half, outside-heart exclusion, and one-time confetti; carousel buttons/dots/keyboard; invalid date/timezone and past-event states; configured map URLs; and 3x-DPR backing-store sizing. Physical iOS/Android touch and assistive-technology testing are still recommended before sending to guests. The integrated browser's mouse-down emulation was incomplete, so scratch threshold tests used controlled Pointer Events rather than claiming a hardware gesture test.

## Publish with GitHub Pages

1. Commit and push the project to your GitHub repository.
2. In the repository, open **Settings → Pages → Build and deployment**.
3. Choose **Deploy from a branch**, select your publishing branch and **`/ (root)`**, then save.
4. Wait for the deployment to finish; GitHub displays the published URL in the Pages settings.

Publish `index.html`, `styles.css`, `script.js`, `invite-config.js`, `favicon.svg`, `door.png`, `curtain.png`, `TajMahal.png`, `images/`, and `vendor/` together. Keep the capital letters in `TajMahal.png` for case-sensitive GitHub Pages paths. The old open-curtain PNG is not required. No deployment-time npm build or SPA route configuration is required when the compiled Tailwind CSS is committed. Do not publish `node_modules/` or the reference recording; neither is an application asset. Set `previewThemes: false`, confirm the date/venue/verse, and replace every remaining placeholder before sending the URL.

For this repository, the expected project URL is `https://danishkz94.github.io/wedding-invite/` once Pages is enabled and deployed. All image paths are relative, so they work on a GitHub Pages project path as well as a custom domain.

## Notes

The invitation uses natural browser scrolling, with no scroll hijacking, particle background, autoplay, audio, RSVP collection, or tracking. Scratch/reveal state lasts only for the current page view, so reloading starts a fresh invitation. Modern browsers with Pointer Events, Canvas 2D, SVG, `ResizeObserver`, and `inert` are the intended target. Personal details require JavaScript; with scripting off a clear contact-the-hosts notice is provided and the entrance cannot trap the page.
