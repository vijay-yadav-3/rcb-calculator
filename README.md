# RCB Calculator - IPL 2026 Playoffs Predictor

Pick winners for upcoming matches and watch the points table update in real-time.

**Live site:** [https://vijay-yadav-3.github.io/rcb-calculator](https://vijay-yadav-3.github.io/rcb-calculator)

📊 **Visitor Stats:** [https://rcb-calculator.goatcounter.com](https://rcb-calculator.goatcounter.com)

---

## How It Works

Cricket data (points table + schedule) is stored on a [GitHub Gist](https://gist.github.com/vijay-yadav-3/718302e78dbf7dbe320ba2b0d39eaf6a) and fetched by the app at runtime.

A GitHub Actions workflow scrapes Cricbuzz on a cron schedule during IPL match hours and updates the Gist automatically. It can also be triggered manually.

---

## Data Source

The app supports two data sources, controlled by the `REACT_APP_DATA_SOURCE` environment variable:

- `gist` (default) — fetches from the GitHub Gist. Used in production.
- `local` — fetches from `public/data/` files. Useful for local development.

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
By default this uses Gist data. To use local data instead, set the env var before starting:

**Linux / macOS:**
```bash
REACT_APP_DATA_SOURCE=local npm start
```

**Windows (PowerShell):**
```powershell
$env:REACT_APP_DATA_SOURCE="local"; npm start
```

**Windows (CMD):**
```cmd
set REACT_APP_DATA_SOURCE=local && npm start
```

---

## GitHub Actions Setup

The workflow needs a `GIST_TOKEN` repository secret — a GitHub Personal Access Token with the `gist` scope. Add it in your repo's Settings → Secrets and variables → Actions.

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
