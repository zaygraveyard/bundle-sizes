#!/usr/bin/env node

import fs from 'fs';
import minimist from 'minimist';
import colors from 'colors/safe.js';
import { padRight, CommandArgumentError } from './utils.js';
//eslint-disable-next-line import/namespace
import * as commands from './commands/index.js';

function getNameAndVersion() {
  const pkg = JSON.parse(
    fs.readFileSync(`${__dirname}/../package.json`, { encoding: 'utf8' }),
  );

  return { name: pkg.name.replace(/^@.*?\//, ''), version: pkg.version };
}
function getUsage() {
  const { name: progName } = getNameAndVersion();
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
function getHelp() {
  return [
    getUsage(),
    ...Object.entries(commands).map(function ([name, { description, help }]) {
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

const commandName = process.argv[2];
const command = commandName && commands[commandName];

if (command) {
  const args = command.parseArgs(process.argv.slice(3));

  Promise.resolve(command.cli(args))
    .then(function (result) {
      //eslint-disable-next-line no-process-exit
      process.exit(0);
    })
    .catch(function (error) {
      const { name: progName } = getNameAndVersion();

      if (error instanceof CommandArgumentError) {
        console.error(`${progName} ${commandName}: ${error.message}`);
      } else {
        console.error(`${progName} ${commandName}:`, error);
      }
      //eslint-disable-next-line no-process-exit
      process.exit(1);
    });
} else {
  const { help: showHelp = false, version: showVersion = false } = minimist(
    process.argv.slice(2),
    {
      alias: {
        h: 'help',
        v: 'version',
      },
    },
  );

  if (showVersion) {
    console.error(`v${getNameAndVersion().version}`);
    //eslint-disable-next-line no-process-exit
    process.exit(0);
  }
  if (showHelp) {
    console.error(getHelp());
    //eslint-disable-next-line no-process-exit
    process.exit(0);
  }
  console.error(getUsage());
  //eslint-disable-next-line no-process-exit
  process.exit(1);
}
