# Deploy checklist: GitHub org site, Search Console, Bing

Target: the organization root site `https://babaships.github.io/`. English brand and org: `babaships`. Chinese brand: 澳爸在造. Bylines: "Baba · babaships" (en) and "澳爸 · 澳爸在造" (zh). Nothing here has been run. Needs Node 18+ locally (no dependencies).

Why an org root site: `robots.txt` and the sitemap only work at the host root. A project path (`user.github.io/repo/`) cannot own them.

## 0. Before you push (the repo and site are public)

- [ ] Check that the org name `babaships` is free: open https://github.com/babaships . A 404 means it is free (it returned 404 on 2026-11-24). If it is taken, stop and pick another name, then change the default `SITE_URL` in `build.mjs`.
- [ ] In `build.mjs`, replace every `TODO` (`grep -n TODO build.mjs`): the waitlist form action (`TODO-FORM-ACTION` posts nowhere), the contact email and form provider on the Privacy page, `GOATCOUNTER`.
- [ ] Pages with `[FILL FROM SESSION n]` blocks build as `noindex` and stay out of the sitemap. Fill them from real sessions to make them indexable.
- [ ] No child face, name, school or suburb anywhere. Commit with your GitHub noreply address, not your work email (check `git log --format=%ae`).
- [ ] GitHub Pages terms do not allow a site "primarily directed at facilitating commercial transactions". Free files plus a waitlist is fine. Sell the course elsewhere or move to a custom domain on another host first.

## 1. Create the organization (browser)

Open https://github.com/organizations/plan > **Create a free organization** > organization name `babaships` > contact email (any you own; it is not shown on the site) > "My personal account" > finish.

## 2. Create the repo (browser)

In the org: New repository.
- Name exactly `babaships.github.io`
- **Public** (GitHub Free serves Pages only from public repos)
- No README, .gitignore or licence (it must be empty)

## 3. Push

```
cd <this site folder>
git remote add origin https://github.com/babaships/babaships.github.io.git
git push -u origin main
```
(SSH instead: `git@github.com:babaships/babaships.github.io.git`.)

## 4. Turn on Pages

Repo > Settings > Pages > Build and deployment > Source: **GitHub Actions**.
Then Actions > the `pages` run. If it is red (it ran before Pages was on), click **Re-run all jobs**.

The workflow builds with `SITE_URL=https://babaships.github.io/` taken from GitHub, so no code edit is needed for the URL. The build fails in CI if the URL is still a placeholder.

Optional repo variables (Settings > Secrets and variables > Actions > Variables), used by the workflow: `GOATCOUNTER` (site code), `GSC_TOKEN`, `BING_TOKEN` (meta-tag verification values). With no `GOATCOUNTER` the site loads no script and the Privacy page says so; with one, it loads one cookie-free GoatCounter script and the Privacy page says that.

## 5. Confirm it is live

```
curl -sI https://babaships.github.io/ | head -1             # HTTP/2 200
curl -s  https://babaships.github.io/robots.txt             # Sitemap: https://babaships.github.io/sitemap.xml
curl -s  https://babaships.github.io/sitemap.xml | head     # <loc> lines start with https://babaships.github.io/
curl -s  https://babaships.github.io/ | grep canonical      # https://babaships.github.io/
```
Open the site and click Home, Lessons, About, the language switch. The first deploy can take a few minutes.

## 6. After every content change

```
SITE_URL=https://babaships.github.io/ node build.mjs
python3 -m http.server 8080 --bind 127.0.0.1 --directory dist     # leave running
SITE=https://babaships.github.io node check.mjs                         # second terminal; then stop the server
git add -A && git commit -m "..." && git push
```
`check.mjs` also lints: one `<h1>`, title 60 characters or less, and a lead paragraph of 150 characters or less right after the H1.

Project-path option (not recommended): `SITE_URL=https://<user>.github.io/<repo>/ node build.mjs` works, but `robots.txt` and its `Sitemap:` line are not read there. Check it by serving a folder that holds `<repo>` -> `dist` and running `BASE=/<repo> SITE=https://<user>.github.io node check.mjs`.

---

## Later: Google Search Console

A `github.io` site cannot use DNS verification, so use a **URL-prefix** property.

1. https://search.google.com/search-console > Add property > **URL prefix** > `https://babaships.github.io/`
2. Pick **HTML tag**. Copy the value of `content="..."`. Set it as the `GSC_TOKEN` repo variable (step 4), then push any change or re-run the workflow. The build writes the `<meta name="google-site-verification">` tag.
3. Click Verify.
4. Sitemaps > enter `sitemap.xml` > Submit.
5. URL Inspection > paste the home URL > Request indexing. Repeat for `/lessons/`.

## Later: Bing Webmaster Tools

1. https://www.bing.com/webmasters > sign in.
2. Easiest: **Import from Google Search Console** and approve (copies the property and sitemap).
3. Or Add site `https://babaships.github.io/` and verify with the meta tag. Set its `content` value as the `BING_TOKEN` repo variable and re-run the workflow.
4. Sitemaps > Submit `https://babaships.github.io/sitemap.xml`.
