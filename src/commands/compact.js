import minimist from 'minimist';
import { filter } from '../index.js';
import { CommandArgumentError } from '../utils.js';
import {
  handleUnknownCLIOption,
  readSizesFile,
  writeSizesFile,
} from './utils.js';

export async function cli({
  _: [sizesFilePath],
  'keep-missing-files': keepMissingFiles,
  'keep-empty-files': keepEmptyFiles,
}) {
  if (!sizesFilePath) {
    throw new CommandArgumentError('missing argument <file>');
  }

  try {
    await writeSizesFile(
      sizesFilePath,
      await filter(await readSizesFile(sizesFilePath), {
        keepMissingFiles,
        keepEmptyFiles,
      }),
    );
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}
export const description =
  'Compacts the bundle sizes list by merging records of the same file.';
export const usage = '[options] <file>';
export const help = [
  '-m, --[no-]keep-missing-files  If set, records of non-exitant files are kept. Otherwise they are removed.',
  '-e, --[no-]keep-empty-files    If set, records of empty files are kept. Otherwise they are removed.',
];
export function parseArgs(argv) {
  return minimist(argv, {
    boolean: ['keep-missing-files', 'keep-empty-files'],
    alias: {
      m: 'keep-missing-files',
      e: 'keep-empty-files',
    },
    default: {
      'keep-missing-files': false,
      'keep-empty-files': false,
    },
    unknown: handleUnknownCLIOption,
  });
}
