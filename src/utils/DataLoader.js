const GITHUB_OWNER = 'vijay-yadav-3';
const GITHUB_REPO = 'rcb-calculator';
const DATA_TAG = 'cricket-data';

const USE_LOCAL_DATA = process.env.REACT_APP_LOCAL_DATA === 'true';

class DataLoader {
  static async fetchReleaseAsset(filename) {
    const cacheBust = `_cb=${Date.now()}`;
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${DATA_TAG}?${cacheBust}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to fetch release info: ${response.status}`);
    }

    const release = await response.json();
    const asset = release.assets.find(a => a.name === filename);
    if (!asset) {
      throw new Error(`Asset "${filename}" not found in release`);
    }

    const assetUrl = `${asset.browser_download_url}?${cacheBust}`;
    const assetResponse = await fetch(assetUrl, { cache: 'no-store' });
    if (!assetResponse.ok) {
      throw new Error(`Failed to download asset: ${assetResponse.status}`);
    }

    return assetResponse.json();
  }

  static async fetchLocalFile(filename) {
    const response = await fetch(`${process.env.PUBLIC_URL}/data/${filename}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `Local file "public/data/${filename}" not found. ` +
        `Fetch it first — see README for instructions.`
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
}

export default DataLoader;
