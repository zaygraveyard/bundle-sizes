import path from 'path';

const proxyHandler = {
  get(target, prop, receiver) {
    if (!(prop in target)) {
      if (prop[0] === 'Δ') {
        let key = prop.slice(1);
        let value;

        if (prop[prop.length - 1] === '%') {
          key = key.slice(0, -1);
          value = (receiver[`Δ${key}`] / receiver[key]) * 100;
        } else {
          value = receiver[`${key}*`] - receiver[key];
        }
        receiver[prop] = value;
      }
    }
    return target[prop];
  },
};

function normalizeFilePaths(map, regexp = /(-)[0-9a-f]{8}(.module.js)$/i) {
  for (const filePath of Object.keys(map)) {
    const normalizedFilePath = filePath.replace(regexp, '$1[hash]$2');

    if (normalizedFilePath !== filePath) {
      map[normalizedFilePath] = map[filePath];
      delete map[filePath];
    }
  }
}

export function compare(
  sizesByFile,
  newSizesByFile,
  { relativeTo, showUnchanged } = {},
) {
  normalizeFilePaths(sizesByFile);
  normalizeFilePaths(newSizesByFile);

  const filePaths = Object.keys({ ...sizesByFile, ...newSizesByFile });
  const records = [];

  for (const filePath of filePaths) {
    const fileName = relativeTo ? path.resolve(relativeTo, filePath) : filePath;
    const record = new Proxy({ fileName }, proxyHandler);
    const sizes = sizesByFile[filePath] || {};
    const newSizes = newSizesByFile[filePath] || {};
    let changedSize = false;

    for (const key of Object.keys({ ...sizes, ...newSizes })) {
      const size = sizes[key] || 0;
      const newSize = newSizes[key] || 0;

      record[key] = size;
      record[`${key}*`] = newSize;
      if (!changedSize && newSize !== size) {
        changedSize = true;
      }
    }
    if (showUnchanged || changedSize) {
      records.push(record);
    }
  }

  const total = new Proxy({ fileName: 'TOTAL' }, proxyHandler);

  for (const record of records) {
    for (const key of Object.keys(record)) {
      total[key] = (total[key] || 0) + record[key];
    }
  }

  records.push(total);
  return records;
}
