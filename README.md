# job_monitor

Hourly fresher/new-grad SWE job monitor for target companies (India, remote, hybrid).

## Run locally

```bash
npm install
npm run run
```

## GitHub Actions secrets

| Secret | Purpose |
|--------|---------|
| `MAIL_TO` | Alert recipient |
| `MAIL_FROM` | Gmail sender address |
| `GMAIL_APP_PASSWORD` | Gmail app password |
| `APIFY_TOKEN` | Apify API token for LinkedIn + careers crawl |

Without `APIFY_TOKEN`, the monitor still runs Phase 1 company APIs only.

## Apify integration

When `APIFY_TOKEN` is set, the hourly run also fetches jobs from `config/apify-sources.json`:

- **LinkedIn Jobs Scraper** (`curious_coder/linkedin-jobs-scraper`) — batch searches for Phase 2 companies (Google, Microsoft, Swiggy, etc.)
- **Website Content Crawler** (`apify/website-content-crawler`) — careers pages for Flipkart and Swiggy

Edit `config/apify-sources.json` to add/remove search URLs or crawl targets. Jobs are matched using the same filters in `config/companies.json`.

Get your Apify token: [Apify Console → Integrations](https://console.apify.com/account/integrations)
