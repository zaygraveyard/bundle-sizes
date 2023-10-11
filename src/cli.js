#!/usr/bin/env node

import minimist from 'minimist';
import colors from 'colors/safe.js';
import { CommandArgumentError } from './utils.js';
import { padRight } from './commands/utils.js';
import * as commands from './commands/index.js';

async function getNameAndVersion() {
  const { readFile } = await import('node:fs/promises');
  const pkg = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), {
      encoding: 'utf8',
    }),
  );

  return { name: pkg.name.replace(/^@.*?\//, ''), version: pkg.version };
}
async function getUsage() {
  const { name: progName } = await getNameAndVersion();
  const usages = [
    ['(-h|--help)', 'Print this screen and exit.'],
    ['(-v|--version)', 'Print version and exit.'],
    ...Object.entries(commands).map(function ([name, { description, usage }]) {
      return [`${colors.bold(name)} ${usage}`, description];
    }),
  ];
  const width = Math.max(
    ...usages.map(function ([args]) {
      return colors.strip(args).length;
    }),
  );

  return [
    'Usage: ',
    ...usages.map(function ([args, description]) {
      return `  ${progName} ${padRight(width, args)}  ${description}`;
    }),
  ].join('\n');
}
async function getHelp() {
  return [
    await getUsage(),
    ...Object.entries(commands).map(function ([name, { help }]) {
      if (!Array.isArray(help)) {
        help = help.split('\n');
      }
      help = help
        .map(function (line) {
          return `  ${line}`;
        })
        .join('\n');
      return `Options for ${colors.bold(name)}:\n${help}`;
    }),
  ].join('\n\n');
}

async function main(_0, _1, commandName, ...args) {
  // eslint-disable-next-line import/namespace
  const command = commandName && commands[commandName];

  if (command) {
    const commandArgs = command.parseArgs(args);

    try {
      await command.cli(commandArgs);
      return 0;
    } catch (error) {
      const { name: progName } = await getNameAndVersion();

      if (error instanceof CommandArgumentError) {
        console.error(`${progName} ${commandName}: ${error.message}`);
      } else {
        console.error(`${progName} ${commandName}:`, error);
      }
      return 1;
    }
  } else {
    const { help: showHelp = false, version: showVersion = false } = minimist(
      [commandName, ...args],
      {
        alias: {
          h: 'help',
          v: 'version',
        },
      },
    );

    if (showVersion) {
      console.error(`v${(await getNameAndVersion()).version}`);
      return 0;
    }
    if (showHelp) {
      console.error(await getHelp());
      return 0;
    }
    console.error(await getUsage());
    return 1;
  }
}

async function _main() {
  //eslint-disable-next-line no-process-exit
  process.exit(await main(...process.argv));
}

_main();
