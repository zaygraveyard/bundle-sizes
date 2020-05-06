import { CommandArgumentError } from '../utils.js';

function isValidSize(value) {
  return typeof value === 'number' && value === Math.trunc(value) && value >= 0;
}

export function create(filePath, sizes = {}) {
  if (!filePath) {
    throw new CommandArgumentError('<file_path> should a non-empty string');
  }
  for (const [key, size] of Object.entries(sizes)) {
    if (!isValidSize(size)) {
      throw new CommandArgumentError(
        `"${key}": <bytes> should a positive integer`,
      );
    }
  }
  return JSON.stringify({ filePath, ...sizes });
}
