# Hosting the Industry Niche Atlas

## Recommended: Cloudflare Pages with GitHub integration

Use Cloudflare Pages for the main hosted copy. It fits this project because the site is a static Vite build, Cloudflare can connect directly to a GitHub repository and redeploy on pushes, and the monthly refresh workflow commits new compact JSON files to `main`. Cloudflare’s official Vite guide uses a Vite build command and an output directory; this repository overrides Vite’s default output to `dist/public`, so use that exact directory here.[1] [2]

1. Open the [Cloudflare Pages dashboard](https://dash.cloudflare.com/) and choose **Workers & Pages → Create application → Pages → Import an existing Git repository**.
2. Authorize Cloudflare to access GitHub, then select `crestog/unemployed-nigg-`.
3. Select `main` as the production branch.
4. Configure the build settings as follows.

| Setting | Value |
| --- | --- |
| Framework preset | Vite, or None if Vite is not listed |
| Root directory | `/` |
| Build command | `pnpm build` |
| Build output directory | `dist/public` |
| Node.js version | `22` if the provider exposes a version setting |
| Environment variables | None required for the real-data release |

5. Choose **Save and deploy**. Cloudflare will give the project a `*.pages.dev` address.
6. Open the deployed address and verify that the release badge shows `20260814`, the industry directory loads, the occupation directory loads, and the Sources section lists O*NET, BLS, Census, and UN sources.
7. In Cloudflare Pages, keep the production branch as `main`. The included GitHub Actions workflow downloads and rebuilds the source-backed JSON monthly. When it commits a new release, Cloudflare’s Git integration should automatically create a new deployment.[1]

The repository is public and the deployed site is public by default. Do not put API keys, cookies, private research notes, or personal data in the frontend. This release does not require any API key. If the site must be private, keep it local or add an access-control layer before publishing; do not assume that a public GitHub repository plus a public static host is private.

## If Cloudflare opens the Workers screen instead

The repository now includes `wrangler.jsonc` with the static asset directory set to `./dist/public`. If the Cloudflare screen you are using explicitly asks for a **Build command** and a **Deploy command**, use:

| Field | Value |
| --- | --- |
| Build command | `pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Token / secret variables | None |

Do not add a token manually. The explicit configuration tells Wrangler to deploy the static output from `dist/public` and to serve `index.html` for SPA fallback. The Pages flow remains preferred because it does not require a deploy command, but this Worker-assets fallback matches the screen that may be shown by the Cloudflare dashboard.

## Alternative: GitHub Pages

GitHub Pages is also free for a public repository, but this repository is a project site rather than a user site. Vite’s official guide says the `base` setting must match the repository path for a project URL.[3] For this repository, that means changing `vite.config.ts` to use `base: "/unemployed-nigg-/"` and adding a Pages deployment workflow that uploads `dist/public`. This is a good alternative if you want to keep hosting entirely inside GitHub, but the base-path change should be tested before merging because it changes asset URLs.

## Alternative: Vercel

Vercel can import the GitHub repository and detect Vite. Use `pnpm build` as the build command and `dist/public` as the output directory. Vercel’s documentation notes that Vite single-page applications need a rewrite for deep links; this project currently uses a single root route, so the issue is limited, but add a `vercel.json` rewrite if additional client-side routes are introduced.[4]

## Local hosting and offline use

For a private, zero-cost copy, clone the repository and run:

```bash
pnpm install --frozen-lockfile
pnpm data:download
pnpm data:build
pnpm dev
```

For a production-like local preview:

```bash
pnpm check
pnpm build
pnpm preview
```

The browser only loads the compact JSON release under `client/public/data`; it does not process the original archives. The original archives remain ignored under `data/raw/` and are used only by the refresh scripts.

## If a deployment fails

First confirm that the host is using `dist/public`, not `dist`. Then inspect the provider build log for Node and pnpm versions. If the data refresh workflow fails because an upstream source blocks automated downloads, do not replace the release with guessed values. Download the official source archive manually, place it under `data/raw/`, run `pnpm data:build`, and push only the resulting compact JSON and manifest.

## References

[1]: https://developers.cloudflare.com/pages/configuration/git-integration/ "Cloudflare Pages Git integration"
[2]: https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/ "Cloudflare Pages Vite deployment guide"
[3]: https://vite.dev/guide/static-deploy "Vite static deployment guide"
[4]: https://vercel.com/docs/frameworks/frontend/vite "Vercel Vite documentation"
