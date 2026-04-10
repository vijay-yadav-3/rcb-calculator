const GIST_BASE = 'https://gist.githubusercontent.com/vijay-yadav-3/718302e78dbf7dbe320ba2b0d39eaf6a/raw';

// Set REACT_APP_DATA_SOURCE=local to use public/data/ instead of Gist
const useLocal = process.env.REACT_APP_DATA_SOURCE === 'local';

class DataLoader {
  static async fetchFile(filename) {
    const url = useLocal
      ? `${process.env.PUBLIC_URL}/data/${filename}`
      : `${GIST_BASE}/${filename}?t=${Date.now()}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(
        useLocal
          ? `File "data/${filename}" not found. Run "node scripts/fetch-cricbuzz.js" first — see README.`
          : `Failed to fetch "${filename}" from Gist.`
      );
    }
    return res.json();
  }

  static async loadPointsTable() {
    return this.fetchFile('pointsTable.json');
  }

  static async loadSchedule() {
    return this.fetchFile('schedule.json');
  }

  static async loadAll() {
    const [pointsTable, schedule] = await Promise.all([
      DataLoader.loadPointsTable(),
      DataLoader.loadSchedule(),
    ]);
    return { pointsTable, schedule };
  }
}

export default DataLoader;
