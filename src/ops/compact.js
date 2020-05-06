import { promises as fs } from 'fs';

async function fsExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
}

export async function compact(
  sizesByFile,
  { keepMissingFiles, keepEmptyFiles } = {},
) {
  for (const [filePath, sizes] of Object.entries(sizesByFile)) {
    //eslint-disable-next-line no-await-in-loop
    if (!keepMissingFiles && !(await fsExists(filePath))) {
      delete sizesByFile[filePath];
    }
    if (!keepEmptyFiles) {
      const isEmpty = Object.values(sizes).every(function (size) {
        return size === 0;
      });

      if (isEmpty) {
        delete sizesByFile[filePath];
      }
    }
  }

  return sizesByFile;
}
