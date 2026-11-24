# Deploy checklist: GitHub Pages, Search Console, Bing

Target: `https://lambertbin.github.io/kids-ai-build/`. Nothing here has been run yet. Needs Node 18+ locally (no dependencies).

## 0. Before you push (the repo and site are public)

- [ ] Pages with `[FILL FROM SESSION n]` blocks build as `noindex` and stay out of the sitemap. Fill them from real sessions to make them indexable.
- [ ] In `build.mjs`, replace every `TODO` (`grep -n TODO build.mjs`): `AUTHOR`, `SITE_NAME`, `DATE`, the waitlist form action (`TODO-FORM-ACTION` posts nowhere), contact email, privacy text.
- [ ] Read the About page. It names your 11 years at AWS and your consulting work. Keep or cut it.
- [ ] No child face, name, school or suburb anywhere. Check `git log` author too: the first commit uses `lambertbin@users.noreply.github.com`, not your work email.

## 1. Create the repo (browser)

github.com > New repository
- Owner: `lambertbin`, name: `kids-ai-build`
- **Public** (GitHub Free serves Pages only from public repos)
- Do **not** add a README, .gitignore or licence (the repo must be empty)

## 2. Push

```
cd <this site folder>
git remote add origin https://github.com/lambertbin/kids-ai-build.git
git push -u origin main
```
(SSH instead: `git@github.com:lambertbin/kids-ai-build.git`.)

If you rename the repo later: `git remote set-url origin <new url>`. The workflow reads the URL from GitHub, so no code change is needed.

## 3. Turn on Pages

Repo > Settings > Pages > Build and deployment > Source: **GitHub Actions**.
Then repo > Actions > the `pages` run. If the first run is red (it ran before Pages was on), open it and click **Re-run all jobs**.

## 4. Confirm it is live

```
curl -sI https://lambertbin.github.io/kids-ai-build/ | head -1          # HTTP/2 200
curl -s  https://lambertbin.github.io/kids-ai-build/sitemap.xml | head   # <loc> lines start with the URL above
curl -s  https://lambertbin.github.io/kids-ai-build/ | grep canonical    # https://lambertbin.github.io/kids-ai-build/
```
Also open the site, click Home, Lessons, About, the language switch, and check the icon loads. First deploy can take a few minutes.

Note: crawlers only read `robots.txt` at the host root (`lambertbin.github.io/robots.txt`), which you do not control. The one in this site is harmless. Submit the sitemap by hand (below).

## 5. After every content change

```
node build.mjs
python3 -m http.server 8080 --bind 127.0.0.1 --directory <dir holding a kids-ai-build -> dist link>
BASE=/kids-ai-build SITE=https://lambertbin.github.io node check.mjs   # second terminal; stop the server after
git add -A && git commit -m "..." && git push
```
Local serve trick: `mkdir -p /tmp/serve && ln -sfn "$PWD/dist" /tmp/serve/kids-ai-build` and serve `/tmp/serve`, so the `/kids-ai-build/` prefix exists.

---

## Later: Google Search Console

A `github.io` site cannot use DNS verification, so use a **URL-prefix** property.

1. https://search.google.com/search-console > Add property > **URL prefix** > `https://lambertbin.github.io/kids-ai-build/`
2. Pick **HTML tag** (meta tag): copy the `<meta name="google-site-verification" content="...">` line. In `build.mjs`, add it inside `<head>` (next to `<link rel="canonical" ...>`). Rebuild, commit, push, wait for the deploy.
   - The HTML-file method also works, but `build.mjs` copies only fixed files, so it needs an extra copy line. Prefer the meta tag.
3. Click Verify.
4. Sitemaps > enter `sitemap.xml` > Submit.
5. URL Inspection > paste the home URL > Request indexing. Repeat for `/lessons/`.

## Later: Bing Webmaster Tools

1. https://www.bing.com/webmasters > sign in.
2. Easiest: **Import from Google Search Console** and approve (copies the property and sitemap).
3. Or Add site `https://lambertbin.github.io/kids-ai-build/` and verify with the meta tag (`<meta name="msvalidate.01" content="...">`, added to `build.mjs` `<head>` as above).
4. Sitemaps > Submit `https://lambertbin.github.io/kids-ai-build/sitemap.xml`.
