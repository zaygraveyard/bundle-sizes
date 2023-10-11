import path from 'node:path';

export function show(
  sizesByFile,
  { relativeTo, showPercent, showMissing, showEmpty } = {},
) {
  const filePaths = Object.keys(sizesByFile);
  const records = [];
  const total = { fileName: 'TOTAL' };

  for (const filePath of filePaths) {
    const fileName = relativeTo ? path.resolve(relativeTo, filePath) : filePath;
    const record = { fileName };
    const sizes = sizesByFile[filePath];
    let emptyRecord = true;

    for (const key of Object.keys(sizes)) {
      const size = sizes[key] || 0;

      record[key] = size;
      total[key] = (total[key] || 0) + size;

      if (emptyRecord && size) {
        emptyRecord = false;
      }
    }
    if (showEmpty || !emptyRecord) {
      records.push(record);
    }
  }

  records.push(total);
  return records;
}
