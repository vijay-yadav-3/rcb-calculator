class DataLoader {
  static async fetchFile(filename) {
    const response = await fetch(`${process.env.PUBLIC_URL}/data/${filename}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(
        `File "data/${filename}" not found. Run "node scripts/fetch-cricbuzz.js" first — see README.`
      );
    }
    return response.json();
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
