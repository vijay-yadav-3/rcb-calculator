# RCB Calculator - IPL 2026 Playoffs Predictor

Pick winners for upcoming matches and watch the points table update in real-time.

**Live site:** [https://vijay-yadav-3.github.io/rcb-calculator](https://vijay-yadav-3.github.io/rcb-calculator)

---

## How It Works

Cricket data (points table + schedule) is scraped from Cricbuzz and committed to `public/data/` by a GitHub Actions workflow. The app loads these JSON files directly — no proxy, no external API at runtime.

The workflow runs on a cron schedule during IPL match hours and can also be triggered manually or via an external cron service (e.g. [cron-job.org](https://cron-job.org)) for more reliable timing.

---

## Running Locally

1. Fetch the latest data from Cricbuzz:
```bash
node scripts/fetch-cricbuzz.js
```
This saves `pointsTable.json` and `schedule.json` into `public/data/`.

2. Start the app:
```bash
npm install
npm start
```

That's it. The app reads from `public/data/` automatically.

---

## Deprecated: RapidAPI (fetch-data.js)

The original data fetching used the Cricbuzz API via RapidAPI. This still works but requires an API key.

1. Get a free API key from [RapidAPI - Cricbuzz Cricket](https://rapidapi.com/apiservicesprovider/api/cricbuzz-cricket2)

2. Fetch the data:
```bash
node scripts/fetch-data.js YOUR_RAPIDAPI_KEY
```

3. Start the app:
```bash
npm install
npm start
```
