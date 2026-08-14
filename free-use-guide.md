# Run the Industry Niche Atlas with real data for free

## What is working now

The project contains a reproducible release built from four public source packages: O*NET 30.3 occupation and work data, BLS May 2025 national OEWS data, NAICS 2022 structure, and ISIC Rev. 5 structure. The browser loads compact JSON from `client/public/data`, so visits do not download or process the original archives. The current release records its source hashes in `manifest.json` and reports `syntheticRecords: 0`.

The product deliberately keeps the industry trees separate from the occupation/work graph. There is no single official universal industry-to-occupation parent-child tree in the sources used here. The interface therefore shows official child records, O*NET task and skill records, and BLS SOC joins separately. It does not manufacture a crosswalk or a “day in the life” percentage chart. A future work-diary layer should be added only from a reviewed dataset or user-supplied observations.

## Recommended free setup

For a personal tool that should open instantly and use almost no laptop resources, use a static deployment backed by a repository and a scheduled data-refresh workflow. The site is built once into static assets; the browser only fetches three compact JSON files. The monthly refresh downloads source archives, rebuilds the release, validates that it is real-source data with zero synthetic records, and commits the changed JSON. A static host then redeploys the latest commit.

| Approach | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- |
| Static host connected to a Git repository, with scheduled repository actions | Fastest visits and almost no laptop compute; requires creating a repository and connecting the host once | Free tiers are sufficient for a private personal site; limits can change, so review the current plan | Moderate one-time setup |
| Run `pnpm data:refresh` locally and deploy the built static site | No external automation or credentials; the laptop must run the refresh and upload step when data changes | Free | Low |
| Use a notebook environment for the refresh, store the generated JSON in a repository, and let the static host deploy it | Keeps refresh compute off the laptop; notebook sessions are not permanent and need manual or scheduled orchestration | Free tiers vary and may sleep or limit runtime | Moderate to high |

The recommended path is the first row. Cloudflare Pages currently advertises a free plan with unlimited static requests and bandwidth, unlimited sites, and 500 builds per month. GitHub Actions supports scheduled workflows using cron syntax. Treat those limits as current-provider claims and recheck them before relying on a larger public deployment.

## Local commands

From the project root, install the Python dependency once and then run:

```bash
python3 -m pip install --user openpyxl
pnpm data:refresh
pnpm check
pnpm build
```

For normal browsing, the live site does not need the original ZIP/XLSX/CSV archives. Keep those files outside the deployed static asset directory if repository size becomes a concern; only the processed JSON under `client/public/data` is required at runtime.

## Source access and limitations

O*NET and the Census/UN structure files are public downloads. ESCO is also freely downloadable, but its current download flow can request an email address and its local API is described by the European Commission as a reference version. ESCO is therefore documented as an optional next source rather than silently scraped. BLS public downloads may return HTTP 403 to some automated environments; the refresh script fails loudly rather than substituting stale or invented numbers. If that occurs, download the official archive from the BLS tables page and place it at `data/raw/bls_oesm25nat.zip` before running `pnpm data:build`.

## Hosting and privacy

For a private personal site, use repository visibility and host access controls rather than exposing the site publicly. Do not put API keys or browser cookies in the repository or in `client/public`. This release needs no API key. If a future source requires credentials, add them only to the refresh environment and never ship them to the browser.

## References

[1]: https://www.onetcenter.org/database.html "O*NET Database at O*NET Resource Center"
[2]: https://www.bls.gov/oes/tables.htm "BLS Occupational Employment and Wage Statistics Tables"
[3]: https://www.census.gov/naics/ "U.S. Census NAICS"
[4]: https://unstats.un.org/unsd/classifications/Econ/isic "UN ISIC Rev. 5"
[5]: https://esco.ec.europa.eu/en/use-esco/download "European Commission ESCO download"
[6]: https://pages.cloudflare.com/ "Cloudflare Pages"
[7]: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions "GitHub Actions workflow syntax"
