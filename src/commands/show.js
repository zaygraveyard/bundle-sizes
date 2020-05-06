import path from 'path';
import minimist from 'minimist';
import { show } from '../index.js';
import {
  CommandArgumentError,
  handleUnknownCLIOption,
  readSizesFile,
  getSizeColor,
  renderSizeBytes,
  renderSizePercent,
  renderTable,
} from '../utils.js';

export async function cli({
  _: [sizesFilePath],
  'relative-to': relativeTo,
  'show-percent': showPercent,
  'show-missing': showMissing,
  'show-empty': showEmpty,
}) {
  if (!sizesFilePath) {
    throw new CommandArgumentError('missing argument <file>');
  }

  const records = show(await readSizesFile(sizesFilePath), {
    relativeTo,
    showPercent,
    showMissing,
    showEmpty,
  });
  const total = records.pop();

  const keys = new Set(
    Object.keys(total).filter(function (key) {
      return key !== 'fileName' && key[key.length - 1] !== '%';
    }),
  );
  const columns = new Set();

  for (const key of keys) {
    columns.add(key);
    if (showPercent && key !== 'size') {
      columns.add(`${key}%`);
    }
  }

  records.sort(function (a, b) {
    return b.fileName < a.fileName ? -1 : 1;
  });
  for (const key of keys) {
    for (const record of records) {
      record[key] = record[key] || 0;
    }
    records.sort(function (a, b) {
      return a[key] > 0 && b[key] > 0 ? b[key] - a[key] : 0;
    });
  }

  records.push(total);
  for (const record of records) {
    const size = record.size;

    if (record !== total && relativeTo) {
      record.fileName = path.relative(process.cwd(), record.fileName);
    }
    for (const key of keys) {
      const color = getSizeColor(record[key]);
      const percentage = (record[key] / size) * 100;

      record[`${key}%`] = renderSizePercent(percentage, false, color);
      record[key] = renderSizeBytes(record[key], false, color);
    }
  }

  const tableColumns = ['fileName', ...columns];
  const header = { fileName: 'File name' };

  for (const key of tableColumns) {
    header[key] = header[key] || key;
  }

  console.log(renderTable([header, ...records]));
}
export const description =
  'Prints a table showing the records in the bundle sizes list.';
export const usage = '[options] <file>';
export const help = [
  '--relative-to=<path>     Treat all "filePath"s in <file> as relative to <path>.',
  '-p, --[no-]show-percent  If set, shows percentages in the table.',
  '-m, --[no-]show-missing  If set, shows records of non-exitant files.',
  '-e, --[no-]show-empty    If set, shows records of empty files.',
];
export function parseArgs(argv) {
  return minimist(argv, {
    string: ['relative-to'],
    boolean: ['show-percent', 'show-missing', 'show-empty'],
    alias: {
      p: 'show-percent',
      m: 'show-missing',
      e: 'show-empty',
    },
    default: {
      'relative-to': null,
      'show-percent': false,
      'show-missing': false,
      'show-empty': false,
    },
    unknown: handleUnknownCLIOption,
  });
}
