import { promises as fs } from 'fs';

async function fsExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

async function filterFileSizes(
  { keepMissingFiles, keepEmptyFiles },
  [filePath, sizes],
) {
  //eslint-disable-next-line no-await-in-loop
  if (!keepMissingFiles && !(await fsExists(filePath))) {
    return false;
  }
  if (!keepEmptyFiles) {
    const isEmpty = Object.values(sizes).every(function (size) {
      return size === 0;
    });

    if (isEmpty) {
      return false;
    }
  }

  return true;
}

export async function filter(sizesByFile, filters = {}) {
  const filtered = await Promise.all(
    Object.entries(sizesByFile).map(filterFileSizes.bind(null, filters)),
  );

  return Object.fromEntries(
    Object.entries(sizesByFile).filter(function (_, i) {
      return filtered[i];
    }),
  );
}
