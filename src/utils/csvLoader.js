export async function loadCSV(path) {
  const res = await fetch(path);
  const text = await res.text();

  const [headerLine, ...rows] = text.split("\n");
  const headers = headerLine.split(",").map(h => h.trim());

  return rows
    .filter(r => r.trim().length)
    .map(row => {
      const values = row.split(",");
      let obj = {};
      headers.forEach((h, i) => {
        const val = values[i]?.trim();
        obj[h] = isNaN(val) ? val : Number(val);
      });
      return obj;
    });
}
