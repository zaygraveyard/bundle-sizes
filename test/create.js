import test from 'ava';
import { CommandArgumentError } from '../src/utils.js';
import { create } from '../src/index.js';

test('normal', (t) => {
  const path = 'a/path/to/a/file';
  const sizes = {
    size: 200,
    minified: 100,
    gziped: 20,
  };
  const record = create(path, sizes);
  const parsedRecord = JSON.parse(record);

  t.deepEqual(parsedRecord, { filePath: path, ...sizes });
});

test('no args', (t) => {
  t.throws(() => create(), { instanceOf: CommandArgumentError });
});

test('empty file path', (t) => {
  t.throws(() => create(''), { instanceOf: CommandArgumentError });
});

test('no sizes', (t) => {
  const path = 'a/path/to/a/file';
  const record = create(path);
  const parsedRecord = JSON.parse(record);

  t.is(parsedRecord.filePath, path);
  t.is(Object.keys(parsedRecord).length, 1);
});

test('invalid sizes', (t) => {
  const path = 'a/path/to/a/file';

  t.throws(() => create(path, { size: null }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: undefined }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: true }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: false }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: '' }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: '1' }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: -5 }), {
    instanceOf: CommandArgumentError,
  });
  t.throws(() => create(path, { size: 1.1 }), {
    instanceOf: CommandArgumentError,
  });
});
