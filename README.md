# fs-kv-cache

[中文文档](./readme-zh-cn.md)

A lightweight file system-based Key-Value cache library with a localStorage-like API.

## Features

- 🗂️ File system storage with data persistence
- 📦 MessagePack format for minimal disk usage
- 🔑 MD5 hash sharding to avoid too many files in a single directory
- 💡 localStorage-like API, simple and easy to use
- 📝 Written in JavaScript with full TypeScript support

## Installation

```bash
npm install @iptop/node-fs-cache
```

## Quick Start

```javascript
// ESM
import { FsKvCache } from '@iptop/node-fs-cache';

// CJS
const { FsKvCache } = require('@iptop/node-fs-cache');

// Create a cache instance
const cache = new FsKvCache('./cache');

// Custom directory depth (2-5 levels, default 3)
const cache2 = new FsKvCache('./cache', { depth: 2 });

// Store data
cache.setItem('username', 'john_doe');

// Retrieve data
const value = cache.getItem('username');
console.log(value); // 'john_doe'

// Check if key exists
const exists = cache.hasItem('username');
console.log(exists); // true

// Delete data
cache.removeItem('username');
```

## API

### `new FsKvCache(basePath, options?)`

Create a cache instance.

- `basePath` - Root directory path for cache file storage
- `options.depth` - Directory depth, range 2-5, default 3

### `setItem(key, value)`

Store a key-value pair.

- `key` - String key name
- `value` - Any serializable value

### `getItem(key)`

Get the value for a specified key.

- `key` - String key name
- Returns: The stored value, or `null` if the key doesn't exist

### `hasItem(key)`

Check if a key exists.

- `key` - String key name
- Returns: `boolean`

### `removeItem(key)`

Delete a key-value pair.

- `key` - String key name

## Storage Mechanism

### MD5 Hash Sharding Strategy

To avoid too many files in a single directory, MD5 hash sharding is used:

1. MD5 hash the key
   - Example: `username` → `14c4b06b824ec593239362517f538b29`

2. Create nested directory structure based on depth (default 3 levels)
   - depth=2: `cache/1/4.pack` (max 256 files)
   - depth=3: `cache/1/4/c.pack` (max 4,096 files)
   - depth=4: `cache/1/4/c/4.pack` (max 65,536 files)
   - depth=5: `cache/1/4/c/4/b.pack` (max 1,048,576 files)

### File Content Format

Uses MessagePack format, with file content as an array structure:

```javascript
[[md5Buffer, value], ...]  // md5Buffer is a 16-byte binary Buffer
```

> **Note**: To minimize storage space, cache files don't store the original key, only the MD5 binary and value. Therefore, this library doesn't provide key iteration functionality.

### Hash Collision Handling

When different keys map to the same file (same first few MD5 characters), multiple key-value pairs are stored in the same file, distinguished by the complete MD5 Buffer.

## Design Limitations

- ❌ No key iteration support (`keys()`, `entries()`, etc.)
- ❌ No browser environment support
- ❌ No async operations (synchronous API only)

## Dependencies

- [msgpackr](https://github.com/kriszyp/msgpackr) - MessagePack encoding/decoding

## License

MIT
