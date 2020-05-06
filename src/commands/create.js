import minimist from 'minimist';
import { create } from '../index.js';

export function cli({ _, filePath, ...sizes }) {
  console.log(create(filePath, sizes));
}
export const description =
  'Prints a record to be added to the bundle sizes list.';
export const usage = '[options]';
export const help = [
  '--filePath=<file_path>  The path of the file to be added. [required]',
  '--size=<bytes>          The size in bytes of the file before minification.',
  '--minified=<bytes>      The size in bytes of the file after minification.',
  '--<key>=<bytes>         Any other size in bytes of the file, identified as <key>.',
];
export const parseArgs = minimist;
