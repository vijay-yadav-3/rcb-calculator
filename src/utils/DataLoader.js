const GITHUB_OWNER = 'vijay-yadav-3';
const GITHUB_REPO = 'rcb-calculator';
const DATA_TAG = 'cricket-data';

const USE_LOCAL_DATA = process.env.REACT_APP_LOCAL_DATA === 'true';

const DOWNLOAD_BASE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${DATA_TAG}`;
const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class DataLoader {
  static async fetchReleaseAsset(filename) {
    const url = `${CORS_PROXY}${DOWNLOAD_BASE}/${filename}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${filename}: ${response.status}`);
    }
    return response.json();
  }

  static async fetchLocalFile(filename) {
    const response = await fetch(`${process.env.PUBLIC_URL}/data/${filename}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `Local file "public/data/${filename}" not found. Fetch it first — see README.`
      );
    }
    return response.json();
  }

  static async loadPointsTable() {
    if (USE_LOCAL_DATA) return this.fetchLocalFile('pointsTable.json');
    return this.fetchReleaseAsset('pointsTable.json');
  }

  static async loadSchedule() {
    if (USE_LOCAL_DATA) return this.fetchLocalFile('schedule.json');
    return this.fetchReleaseAsset('schedule.json');
  }

  static async loadAll() {
    const pointsTable = await DataLoader.loadPointsTable();
    await delay(1000);
    const schedule = await DataLoader.loadSchedule();
    return { pointsTable, schedule };
  }
}

export default DataLoader;
