import path from 'path';
import minimist from 'minimist';
import { compare } from '../index.js';
import { CommandArgumentError } from '../utils.js';
import {
  handleUnknownCLIOption,
  readSizesFile,
  getSizeColor,
  renderSizeBytes,
  renderSizePercent,
  renderTable,
} from './utils.js';

export async function cli({
  _: [sizesFilePath, newSizesFilePath],
  'relative-to': relativeTo,
  'show-old': showOld,
  'show-new': showNew,
  'show-diff': showDiff,
  'show-percent': showPercent,
  'show-unchanged': showUnchanged,
}) {
  if (!sizesFilePath) {
    throw new CommandArgumentError('missing argument <old-file>');
  }
  if (!newSizesFilePath) {
    throw new CommandArgumentError('missing argument <new-file>');
  }
  if (sizesFilePath === '-' && newSizesFilePath === '-') {
    throw new CommandArgumentError(
      'reading both <old-file> and <new-file> from stdin is not possible',
    );
  }
  if (!showOld && !showNew && !showDiff && !showPercent) {
    // Nothing to show
    return;
  }

  const records = compare(
    await readSizesFile(sizesFilePath),
    await readSizesFile(newSizesFilePath),
    { relativeTo, showUnchanged },
  );
  const total = records.pop();

  const keys = new Set(
    Object.keys(total).filter(function (key) {
      return key !== 'fileName' && key[key.length - 1] !== '*';
    }),
  );
  const columns = new Set();
  const sortingKeys = new Set();

  for (const key of keys) {
    if (showOld) {
      columns.add(key);
    }
    if (showNew) {
      columns.add(`${key}*`);
    }
    if (showDiff) {
      columns.add(`Δ${key}`);
    }
    if (showPercent) {
      columns.add(`Δ${key}%`);
    }
    sortingKeys.add(`Δ${key}`);
  }

  records.sort(function (a, b) {
    return b.fileName < a.fileName ? -1 : 1;
  });
  for (const key of sortingKeys) {
    for (const record of records) {
      record[key] = record[key] || 0;
    }
    records.sort(function (a, b) {
      return a[key] > 0 && b[key] > 0 ? b[key] - a[key] : 0;
    });
  }

  records.push(total);
  for (const record of records) {
    if (record !== total && relativeTo) {
      record.fileName = path.relative(process.cwd(), record.fileName);
    }
    for (const key of keys) {
      const deltaSize = record[`Δ${key}`];
      const color = getSizeColor(deltaSize, true);

      record[`Δ${key}%`] = deltaSize
        ? renderSizePercent(record[`Δ${key}%`], true, color)
        : '';
      record[key] = renderSizeBytes(record[key]);
      record[`${key}*`] = renderSizeBytes(record[`${key}*`]);
      record[`Δ${key}`] = renderSizeBytes(deltaSize, true, color);
    }
  }

  const tableColumns = ['fileName', ...columns];
  const header = { fileName: 'File name' };

  for (const key of tableColumns) {
    header[key] = header[key] || key;
  }

  console.log(renderTable([header, ...records]));
}
export const description = 'Prints a table comparing two bundle sizes lists.';
export const usage = '[options] <old-file> <new-file>';
export const help = [
  '--relative-to=<path>       Treat all "filePath"s in <new-file> as relative to <path>.',
  '-o, --[no-]show-old        If set, shows size from <old-file>.',
  '-n, --[no-]show-new        If set, shows size from <new-file>.',
  '-d, --[no-]show-diff       If set, shows (<new-file> - <old-file>). Set by default.',
  '-p, --[no-]show-percent    If set, shows percentages of the difference.',
  '-u, --[no-]show-unchanged  If set, shows unchanged records.',
];
export function parseArgs(argv) {
  return minimist(argv, {
    string: ['relative-to'],
    boolean: [
      'show-old',
      'show-new',
      'show-diff',
      'show-percent',
      'show-unchanged',
    ],
    alias: {
      o: 'show-old',
      n: 'show-new',
      d: 'show-diff',
      p: 'show-percent',
      u: 'show-unchanged',
    },
    default: {
      'relative-to': null,
      'show-old': false,
      'show-new': false,
      'show-diff': true,
      'show-percent': false,
      'show-unchanged': false,
    },
    unknown: handleUnknownCLIOption,
  });
}
