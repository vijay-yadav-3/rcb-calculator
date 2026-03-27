# RCB Calculator - IPL 2026 Playoffs Predictor

Pick winners for upcoming matches and watch the points table update in real-time.

**Live site:** `https://<your-github-username>.github.io/rcb-calculator`

---

## Running Locally

### Option 1: Use data from GitHub Releases (default)

Data is fetched from the repo's GitHub Release on every page load.

```bash
npm install
npm start
```

### Option 2: Fetch data yourself with your own API key

1. Get a free API key from [RapidAPI - Cricbuzz Cricket](https://rapidapi.com/cricbuzz-cricket/api/cricbuzz-cricket)

2. Fetch the data:
```bash
node scripts/fetch-data.js YOUR_RAPIDAPI_KEY
```
This saves `pointsTable.json` and `schedule.json` into `public/data/`.

3. Start with local data mode:

   PowerShell:
   ```powershell
   $env:REACT_APP_LOCAL_DATA="true"; npm start
   ```
   CMD:
   ```cmd
   set REACT_APP_LOCAL_DATA=true && npm start
   ```
   Mac/Linux:
   ```bash
   REACT_APP_LOCAL_DATA=true npm start
   ```

The app reads from `public/data/` instead of GitHub Releases when this flag is set.
