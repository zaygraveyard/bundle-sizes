export class CommandArgumentError extends Error {}

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function parseRecordsJSON(recordsJSON) {
  const lines = recordsJSON.split(/,?[\r\n]+/g);
  const records = lines.map(parseJSON).filter(Boolean);

  return records;
}
export function stringifyRecords(records) {
  return records.map(JSON.stringify).join('\n');
}

export function coalesceRecords(records, idKey = 'filePath') {
  const map = new Map();

  for (const record of records) {
    map.set(record[idKey], { ...map.get(record[idKey]), ...record });
  }
  return Array.from(map.values());
}
