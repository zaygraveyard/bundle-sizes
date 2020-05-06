import { promises as fs } from 'fs';
import fileSize from 'filesize';
import colors from 'colors/safe.js';

export class CommandArgumentError extends Error {}
export function handleUnknownCLIOption(arg) {
  if (arg[0] === '-' && arg !== '-') {
    console.warn('Unknown option:', arg);
  }
}

function parseJSON(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

export function parseSizesFile(filesSizesJSON) {
  const lines = filesSizesJSON.split(/,?[\r\n]+/g);
  const filesSizes = lines.map(parseJSON).filter(Boolean);
  const sizesByFile = {};

  for (const { filePath, ...sizes } of filesSizes) {
    const fileSizes = sizesByFile[filePath] || {};

    for (const [key, size] of Object.entries(sizes)) {
      fileSizes[key] = Math.trunc(size);
    }
    sizesByFile[filePath] = fileSizes;
  }

  return sizesByFile;
}
export function stringifySizesFile(sizesByFile) {
  return Object.entries(sizesByFile)
    .map(function ([filePath, sizes]) {
      return JSON.stringify({ filePath, ...sizes });
    })
    .join('\n');
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

export async function readSizesFile(sizesFilePath, options) {
  const filesSizesJSON =
    sizesFilePath === '-'
      ? await readStdin()
      : await fs.readFile(sizesFilePath, { encoding: 'utf8' });

  return parseSizesFile(filesSizesJSON, options);
}
export async function writeSizesFile(sizesFilePath, sizesByFile) {
  const filesSizesJSON = stringifySizesFile(sizesByFile);

  if (sizesFilePath === '-') {
    process.stdout.write(filesSizesJSON);
  } else {
    await fs.writeFile(sizesFilePath, filesSizesJSON, {
      encoding: 'utf8',
      flag: 'w',
    });
  }
}

export function repeat(string, times) {
  return new Array(Math.max(0, times + 1)).join(string);
}
export function padLeft(width, string) {
  return repeat(' ', width - colors.strip(string).length) + string;
}
export function padRight(width, string) {
  return string + repeat(' ', width - colors.strip(string).length);
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
        : (delta && size > 0 ? '+' : '') + fileSize(size)
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
