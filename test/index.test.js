import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FsKvCache } from '../src/index.js';

const TEST_CACHE_DIR = './test-cache';
let cache;

beforeEach(() => {
  cache = new FsKvCache(TEST_CACHE_DIR);
});

afterEach(() => {
  if (existsSync(TEST_CACHE_DIR)) {
    rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
  }
});

test('should store and retrieve string value', () => {
  cache.setItem('name', 'john');
  assert.strictEqual(cache.getItem('name'), 'john');
});

test('should store and retrieve number value', () => {
  cache.setItem('age', 25);
  assert.strictEqual(cache.getItem('age'), 25);
});

test('should store and retrieve object value', () => {
  const obj = { foo: 'bar', num: 123 };
  cache.setItem('data', obj);
  assert.deepStrictEqual(cache.getItem('data'), obj);
});

test('should store and retrieve array value', () => {
  const arr = [1, 2, 3, 'a', 'b'];
  cache.setItem('list', arr);
  assert.deepStrictEqual(cache.getItem('list'), arr);
});

test('should store and retrieve boolean value', () => {
  cache.setItem('flag', true);
  assert.strictEqual(cache.getItem('flag'), true);
});

test('should store and retrieve null value', () => {
  cache.setItem('empty', null);
  assert.strictEqual(cache.getItem('empty'), null);
});

test('should overwrite existing value', () => {
  cache.setItem('key', 'value1');
  cache.setItem('key', 'value2');
  assert.strictEqual(cache.getItem('key'), 'value2');
});

test('should return null for non-existent key', () => {
  assert.strictEqual(cache.getItem('nonexistent'), null);
});

test('hasItem should return true for existing key', () => {
  cache.setItem('exists', 'value');
  assert.strictEqual(cache.hasItem('exists'), true);
});

test('hasItem should return false for non-existent key', () => {
  assert.strictEqual(cache.hasItem('notexists'), false);
});

test('hasItem should return true for key with null value', () => {
  cache.setItem('nullkey', null);
  assert.strictEqual(cache.hasItem('nullkey'), true);
});

test('removeItem should remove existing key', () => {
  cache.setItem('toremove', 'value');
  assert.strictEqual(cache.hasItem('toremove'), true);
  cache.removeItem('toremove');
  assert.strictEqual(cache.hasItem('toremove'), false);
  assert.strictEqual(cache.getItem('toremove'), null);
});

test('removeItem should not throw when removing non-existent key', () => {
  assert.doesNotThrow(() => {
    cache.removeItem('nonexistent');
  });
});

test('should handle multiple keys in same file', () => {
  const keys = ['key1', 'key2', 'key3', 'key4', 'key5'];
  keys.forEach((key, index) => {
    cache.setItem(key, `value${index}`);
  });
  keys.forEach((key, index) => {
    assert.strictEqual(cache.getItem(key), `value${index}`);
  });
});

test('should create correct directory structure with default depth 3', () => {
  cache.setItem('test', 'value');
  // 'test' 的 MD5: 098f6bcd4621d373cade4e832627b4f6
  const expectedPath = join(TEST_CACHE_DIR, '0', '9', '8.pack');
  assert.strictEqual(existsSync(expectedPath), true);
});

test('should persist data across instances', () => {
  cache.setItem('persistent', 'data');
  const cache2 = new FsKvCache(TEST_CACHE_DIR);
  assert.strictEqual(cache2.getItem('persistent'), 'data');
});

test('should support depth 2', () => {
  const cache2 = new FsKvCache(TEST_CACHE_DIR + '-d2', { depth: 2 });
  cache2.setItem('test', 'value');
  // 'test' 的 MD5: 098f6bcd4621d373cade4e832627b4f6
  const expectedPath = join(TEST_CACHE_DIR + '-d2', '0', '9.pack');
  assert.strictEqual(existsSync(expectedPath), true);
  assert.strictEqual(cache2.getItem('test'), 'value');
  rmSync(TEST_CACHE_DIR + '-d2', { recursive: true, force: true });
});

test('should support depth 4', () => {
  const cache4 = new FsKvCache(TEST_CACHE_DIR + '-d4', { depth: 4 });
  cache4.setItem('test', 'value');
  // 'test' 的 MD5: 098f6bcd4621d373cade4e832627b4f6
  const expectedPath = join(TEST_CACHE_DIR + '-d4', '0', '9', '8', 'f.pack');
  assert.strictEqual(existsSync(expectedPath), true);
  assert.strictEqual(cache4.getItem('test'), 'value');
  rmSync(TEST_CACHE_DIR + '-d4', { recursive: true, force: true });
});

test('should clamp depth to valid range', () => {
  const cacheMin = new FsKvCache(TEST_CACHE_DIR + '-min', { depth: 1 });
  cacheMin.setItem('test', 'value');
  // depth 1 应该被限制为 2
  const expectedMin = join(TEST_CACHE_DIR + '-min', '0', '9.pack');
  assert.strictEqual(existsSync(expectedMin), true);
  rmSync(TEST_CACHE_DIR + '-min', { recursive: true, force: true });

  const cacheMax = new FsKvCache(TEST_CACHE_DIR + '-max', { depth: 10 });
  cacheMax.setItem('test', 'value');
  // depth 10 应该被限制为 5
  const expectedMax = join(TEST_CACHE_DIR + '-max', '0', '9', '8', 'f', '6.pack');
  assert.strictEqual(existsSync(expectedMax), true);
  rmSync(TEST_CACHE_DIR + '-max', { recursive: true, force: true });
});
