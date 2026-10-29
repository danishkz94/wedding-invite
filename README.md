# Wedding invitation

A mobile-first, static wedding invitation built with plain HTML, CSS, and JavaScript. It works on GitHub Pages and needs no install, build step, API key, or backend. The flow includes an opening door, couple introduction, Quranic verse, heart scratch card, swipeable photo carousel, countdown, venue map, and closing note.

## Make it yours

Edit `invite-config.js`. All wedding-specific data lives there. Text fields use `[PLACEHOLDER: ...]` values; the short `Bride`/`Groom` display names and valid demo `eventDate` are identified as examples in comments. Replace every sample value before publishing.

Set `couple.eventDate` to the ceremony date and time in ISO 8601 format with the correct local UTC offset, for example `2027-06-19T16:00:00-04:00`. Update `displayDate` and `displayTime` separately; those are the exact labels shown to guests and in the scratch card. The countdown uses `eventDate`.

The Quranic Arabic, translation, and surah/ayah reference are intentionally placeholders. Replace them with the text and translation you intend to use.

## Swap the photos

The carousel image list is `gallery.photos` in `invite-config.js`. Each entry has a local `src`, descriptive `alt` text, caption, photographer, and credit link. Replace the files in `images/` or add your own local images and update the corresponding `src` paths. Keep each image's license and attribution details in this README when required.

Bundled sample-image credits:

- `images/hands-rings.jpg`: Ainur Iman, [Unsplash](https://unsplash.com/photos/hands-exchanging-wedding-rings-with-henna-designs-7pbuF9zb0GA), Unsplash License.
- `images/rings-linen.jpg`: Paige Johnson, [Unsplash](https://unsplash.com/photos/two-wedding-rings-sitting-on-top-of-a-white-cloth-Ci9LwmMEyeI), Unsplash License.
- `images/henna.jpg`: Munmi Boruah, [Unsplash](https://unsplash.com/photos/person-applying-henna-floral-patterns-G38Afi5yYCk), Unsplash License.
- `images/flowers.jpg`: Marian Brandt, [Unsplash](https://unsplash.com/photos/pink-and-white-flowers-in-clear-glass-vase-3ZkrDmHz3H8), Unsplash License.

## Preview locally

From the project folder, run:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` and tap **Tap to open**. Stop the local server with `Ctrl+C`. The page can also be opened directly as `index.html`, but serving the folder is closer to its published setup.

## Publish with GitHub Pages

1. Commit and push the project to your GitHub repository.
2. In the repository, open **Settings → Pages → Build and deployment**.
3. Choose **Deploy from a branch**, select your publishing branch and **`/ (root)`**, then save.
4. Wait for the deployment to finish; GitHub displays the published URL in the Pages settings.

For this repository, the expected project URL is `https://danishkz94.github.io/wedding-invite/` once Pages is enabled and deployed. All image paths are relative, so they work on a GitHub Pages project path as well as a custom domain.

## Notes

The map uses the configured address with Google's keyless embed and directions URLs. Google Fonts are optional enhancements; local font fallbacks remain in place. Door, reveal, and confetti animations respect `prefers-reduced-motion`. No RSVP collection, tracking, or audio is included.
