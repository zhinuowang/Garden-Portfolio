# Deploying to Cloudflare Pages (Free plan)

The site is a fully static export. `npm run build` writes plain files to `out/`:
- It needs no server, no paid services, no R2 and no custom domain.
- It runs on the free `*.pages.dev` address.
- Every font, image, sound and video is served from the site itself, with no third-party requests at runtime.

## Cloudflare Pages settings

Go to Workers & Pages, then Create, then Pages, then Connect to Git. Choose `zhinuowang/Garden-Portfolio` and enter:

| Setting | Value |
| --- | --- |
| Framework preset | **None** (the build below is all it needs; don't pick "Next.js", which expects a server build) |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | *(leave empty)* |
| Environment variable | `NODE_VERSION` = `22` (also pinned in `.node-version`) |

No other environment variables, secrets or bindings are needed.

## Limits checked (2026-11-21)

- **Per-file limit (25 MiB):** the largest file in `out/` is the AURELLE film at 20.91 MiB. Everything else is under 3.3 MiB.
- **Total:** 274 files and about 48 MB in `out/`, far below the 20,000-file limit.
- **Master film:** `media/master/aurelle-commercial-master.mp4` (85 MB) is in the repository but outside `public/`, so it is never uploaded to Pages.

## How the site behaves on Pages

- **Clean URLs:** `/about` serves `about.html`, and `/work/aurelle` serves `work/aurelle.html`. Pages does this automatically.
- **Missing pages:** they get the site's own `404.html`.
- **Video:** Pages answers byte-range requests, which Safari needs to play it.

## Check before each deploy

```bash
npm run build
```

Then confirm that no file in `out/` is over 25 MiB:

```bash
find out -type f -size +25M
```

This should print nothing.
