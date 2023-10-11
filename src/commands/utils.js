import fs from 'node:fs/promises';
import { filesize } from 'filesize';
import colors from 'colors/safe.js';
import {
  parseRecordsJSON,
  stringifyRecords,
  coalesceRecords,
} from '../utils.js';

export function handleUnknownCLIOption(arg) {
  if (arg[0] === '-' && arg !== '-') {
    console.warn('Unknown option:', arg);
  }
}

export function recordsFromSizesFile(sizesByFile, idKey = 'filePath') {
  return Object.entries(sizesByFile).map(function ([id, sizes]) {
    return { [idKey]: id, ...sizes };
  });
}
export function recordsToSizesFile(records, idKey = 'filePath') {
  const sizesByFile = {};

  for (const { [idKey]: id, ...sizes } of records) {
    sizesByFile[id] = sizes;
  }
  return sizesByFile;
}

function readStdin() {
  return new Promise(function (resolve, reject) {
    let code = '';

    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', function () {
      const chunk = process.stdin.read();

      if (chunk !== null) {
        code += chunk;
      }
    });
    process.stdin.on('end', function () {
      resolve(code);
    });
    process.stdin.on('error', reject);
  });
}

export async function readSizesFile(sizesFilePath) {
  const filesSizesJSON =
    sizesFilePath === '-'
      ? await readStdin()
      : await fs.readFile(sizesFilePath, { encoding: 'utf8' });

  return recordsToSizesFile(coalesceRecords(parseRecordsJSON(filesSizesJSON)));
}
export async function writeSizesFile(sizesFilePath, sizesByFile) {
  const filesSizesJSON = stringifyRecords(recordsFromSizesFile(sizesByFile));

  if (sizesFilePath === '-') {
    process.stdout.write(filesSizesJSON);
  } else {
    await fs.writeFile(sizesFilePath, filesSizesJSON, {
      encoding: 'utf8',
      flag: 'w',
    });
  }
}

export function padLeft(width, string) {
  return ' '.repeat(width - colors.strip(string).length) + string;
}
export function padRight(width, string) {
  return string + ' '.repeat(width - colors.strip(string).length);
}

export function getSizeColor(size, delta) {
  return colors[
    delta
      ? size > 10 * 1024
        ? 'red'
        : size > 5 * 1024
        ? 'yellow'
        : size > 0
        ? 'cyan'
        : 'green'
      : size > 100 * 1024
      ? 'red'
      : size > 40 * 1024
      ? 'yellow'
      : size > 20 * 1024
      ? 'cyan'
      : 'green'
  ];
}
export function renderSizeBytes(
  size,
  delta,
  color = getSizeColor(size, delta),
) {
  return color(
    isFinite(size)
      ? size === 0
        ? '--'
        : (delta && size > 0 ? '+' : '') + filesize(size)
      : '',
  );
}
export function renderSizePercent(percentage, delta, color) {
  if (!isFinite(percentage)) {
    return '';
  }
  percentage = Math.round(percentage * 100) / 100;
  if (Math.abs(percentage) === 0) {
    return '-- %';
  }
  if (Math.abs(percentage) === 100) {
    return '';
  }

  const plus = delta && percentage > 0 ? '+' : '';
  const percent = percentage.toFixed(2).replace(/00$/, '--');
  const rendered = `${plus}${percent} %`;

  return color ? color(rendered) : rendered;
}
export function renderTable(rows) {
  const keys = Object.keys(rows[0]);
  const width = keys.map(function (key) {
    return Math.max(
      ...rows.map(function (row) {
        return colors.strip(row[key]).length;
      }),
    );
  });
  const header = rows[0];
  const footer = rows[rows.length - 1];

  for (const key of keys) {
    header[key] = colors.bold(header[key]);
    footer[key] = colors.bold(footer[key]);
  }

  return rows
    .map(function (row) {
      return [
        '',
        ...keys.map(function (key, i) {
          return padLeft(width[i], row[key]);
        }),
      ].join(' ');
    })
    .join('\n');
}
