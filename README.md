# AI-Ready RevOps — aireadyrevops.com

Full static site for the AI-Ready RevOps brand. Built to be fast, SEO-strong, and to host the interactive 15-question self-assessment as the primary conversion mechanism.

---

## What's in the box

```
site/
├── index.html                              # Homepage
├── assessment.html                         # The 15-question quiz
├── framework.html                          # Methodology deep-dive
├── services.html                           # 3-tier pricing + FAQs
├── about.html                              # Author / credibility
├── blog/
│   ├── index.html                          # Blog landing
│   ├── ai-on-broken-foundations.html       # Cornerstone post 1 (the thesis)
│   ├── six-dimensions-explained.html       # Cornerstone post 2 (methodology)
│   └── when-not-to-buy-ai.html             # Cornerstone post 3 (contrarian)
├── css/style.css                           # Full design system
├── js/assessment.js                        # Quiz engine (questions, scoring, results)
├── assets/
│   ├── favicon.svg
│   ├── og-image.png                        # Social share card (1200×630)
│   └── og-image.svg                        # Source SVG (editable)
├── sitemap.xml
├── robots.txt
└── README.md                               # This file
```

No build step. No frameworks. No npm install. It's just HTML, CSS, and one JS file. Deploy by uploading.

---

## Hosting — recommended setup

### Option 1 (recommended): Cloudflare Pages

Free, fast global CDN, easy custom domain. Best Core Web Vitals out of the box.

1. Push the `site/` directory to a GitHub repo.
2. Sign in at https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select the repo. Build settings: **leave build command blank**, set output directory to `/`.
4. Deploy. You'll get a `*.pages.dev` URL within a minute.
5. Add custom domain: **Custom domains** → **Set up a custom domain** → enter `aireadyrevops.com` and `www.aireadyrevops.com`. Cloudflare will give you DNS instructions (CNAME or apex via flattening). Update at your domain registrar.

### Option 2: Netlify

Equally easy, same general flow. Drag and drop the `site/` folder at https://app.netlify.com/drop for a 30-second deploy. Add custom domain in **Domain settings** → follow DNS instructions.

### Option 3: Vercel

Same workflow as Cloudflare via Git connection. https://vercel.com/new

### Option 4: GitHub Pages

Free but slower CDN. Push to `gh-pages` branch or `/docs` folder of `main`. Settings → Pages → enable. Custom domain via `CNAME` file.

---

## Wiring the assessment email capture

The quiz is fully functional client-side: scoring, dimension breakdown, top-3 priorities, results display. The one piece that needs your decision is **what happens to the email**.

Open `js/assessment.js`. Find the `submitEmail()` function — there's a commented `fetch()` block:

```js
// fetch('https://formspree.io/f/YOUR_ID', { method:'POST', ... })
```

Pick one:

### Easiest: Formspree (or Web3Forms)
1. Sign up at https://formspree.io (free tier: 50 submissions/month) or https://web3forms.com (free tier: 250/month).
2. Create a form, copy the endpoint URL.
3. Uncomment the `fetch()` block in `assessment.js`, paste your URL.
4. The full result payload (email, score, dimension breakdown, all 15 answers) goes to your inbox automatically.

### Better: Cloudflare Worker → MailerLite/Resend/HubSpot
For automated drip sequences segmented by score band (the GTM funnel design):

1. Create a Cloudflare Worker that receives the POST.
2. Worker calls your email tool's API to add the contact with custom properties (score band, dimension scores).
3. Set up automation in your email tool that sends different sequences based on score band.

**Recommended segmentation (already designed in the framework):**
- 80–100 → "You're AI-Ready" sequence (Tier 3 workshop offer)
- 65–79 → "Most foundations in place" (Tier 2 offer)
- 50–64 → "Your AI is at risk" (urgency-framed Tier 2 offer)
- 35–49 → "Foundational gaps" (Tier 1 offer + education)
- 0–34 → "Don't buy AI yet" (long education sequence + Tier 1)

### Best: HubSpot Forms
If you already use HubSpot, create a form there, use its endpoint, and you get full CRM integration with workflows, lifecycle stages, and lead scoring out of the box.

---

## Analytics

The site is intentionally privacy-first. Recommended:

- **Plausible** ($9/mo) — privacy-friendly, no cookie banner needed. Add one `<script>` tag.
- **Fathom** ($14/mo) — same idea, slightly different feature set.
- **Cloudflare Web Analytics** (free) — basic but adequate.

Add the snippet to all HTML files just before `</body>`. (Avoid Google Analytics if you can — it requires a cookie banner under GDPR and slows the page.)

The key events to track:
- `Assessment started` (click on "Begin assessment")
- `Question N answered`
- `Email submitted`
- `Email skipped`
- `CTA: Tier N` clicked

Most analytics tools support custom events with one extra line of JS in `assessment.js`.

---

## Updating content

### Adding a blog post

Copy any of the existing posts in `blog/` as a template. Update:
- `<title>` and meta description
- `<link rel="canonical">` URL
- Open Graph tags
- Schema.org JSON-LD (datePublished, headline, etc.)
- The article body (use the existing `.prose` class for typography)
- Add an entry to `blog/index.html`
- Add a `<url>` block to `sitemap.xml`

### Updating prices, tiers, copy

Most marketing copy lives in `index.html` and `services.html`. Edit directly. Watch out for the `Schema.org` JSON-LD blocks — if you change prices, update them there too (search engines validate).

### Changing the design system

All design tokens are CSS variables at the top of `css/style.css`. Change the `--accent` color, the fonts, or the spacing scale once and it propagates everywhere.

---

## Performance notes

The site is already fast, but a few optimizations to consider once it's live:

- **Self-host fonts** instead of Google Fonts to remove the third-party connection. Download Fraunces, Geist, Geist Mono and serve from `/assets/fonts/`. Will improve LCP by 100–300ms.
- **Convert the OG image to WebP** for ~40% smaller file. PNG works fine; WebP is just nicer.
- **Add `<link rel="preload">`** for the hero font weights.
- **Cloudflare Pages auto-handles** Brotli compression, HTTP/3, and image optimization.

Don't over-optimize before launching. The site passes Core Web Vitals as-is.

---

## SEO checklist (post-launch)

1. Submit `https://aireadyrevops.com/sitemap.xml` to Google Search Console and Bing Webmaster Tools.
2. Verify domain ownership in both.
3. Request indexing for the homepage and `/assessment.html`.
4. Set up a **Google Business Profile** for WhizzLead (optional but useful for E-E-A-T signals).
5. Build initial backlinks: LinkedIn personal page, YouTube channel, any guest posts you can place.
6. Targeted keywords (from competitive analysis):
   - **Primary**: "AI-ready RevOps", "AI readiness assessment", "AI RevOps audit", "RevOps AI readiness"
   - **Secondary**: "RevOps maturity assessment", "Salesforce AI readiness", "revenue stack audit"
   - **Long-tail blog**: "why is my AI not working CRM", "is my data ready for AI", "should I buy AI for sales"

The cornerstone blog posts already target these patterns.

---

## Content engine (the next 90 days)

The methodology produces 12 natural video/article topics — the framework has them baked in. Recommended publishing cadence:

- **Weeks 1–2**: Launch + the 3 cornerstone posts already on the site
- **Weeks 3–8**: One post per dimension (6 posts, ~1 every 5 days). Each post becomes a YouTube video. Each links back to the assessment.
- **Weeks 9–12**: Three case studies (anonymized), the cost-of-inaction model, and "When NOT to buy AI" follow-ups.

Distribution: YouTube long-form, LinkedIn carousels (one per dimension), X threads, the AI-Ready RevOps newsletter (set up via the same email tool you use for assessment capture).

---

## What needs your final touches

Before launch:

- [ ] Replace `hello@aireadyrevops.com` with your real inbox if different (search across all `.html` files).
- [ ] Wire the email capture endpoint in `js/assessment.js`.
- [ ] Add analytics snippet to all `.html` files.
- [ ] Verify the LinkedIn and YouTube URLs in `index.html` and `about.html` match your handles.
- [ ] Replace placeholder author avatar (currently the letter "V" in a circle) with a real photo if desired — see `.author-avatar` class in `style.css`.
- [ ] Set up Google Search Console and Bing Webmaster Tools.
- [ ] Add `aireadyrevops.com` and `www.aireadyrevops.com` as Cloudflare Pages custom domains.
- [ ] Optional: customize the OG image at `assets/og-image.svg` if you want to tweak the headline before sharing.

---

## Maintenance philosophy

The site is intentionally simple so it doesn't become a maintenance burden. Static HTML, no database, no dependencies, no security patches. The only thing that needs ongoing love is:

1. The blog (publish regularly).
2. The assessment (refine based on data — when 1,000 people have taken it, you'll see which questions are noisy).
3. Pricing/services updates (rare).

Treat everything else as set-and-forget.

---

Built with: HTML, CSS, vanilla JS. No frameworks, no build step, no node_modules.
Hosted on: any static host. Recommended Cloudflare Pages.
Domain: aireadyrevops.com (already purchased).
