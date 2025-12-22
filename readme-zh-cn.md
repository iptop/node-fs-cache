# fs-kv-cache

一个基于文件系统的轻量级 Key-Value 缓存库，提供类似 localStorage 的 API 风格。

## 特性

- 🗂️ 基于文件系统存储，数据持久化
- 📦 使用 MessagePack 格式存储，最小化磁盘占用
- 🔑 MD5 哈希分片存储，避免单目录文件过多
- 💡 类 localStorage API，简单易用
- 📝 JavaScript 编写，完整 TypeScript 类型支持

## 安装

```bash
npm install @iptop/node-fs-cache
```

## 快速开始

```javascript
// ESM
import { FsKvCache } from '@iptop/node-fs-cache';

// CJS
const { FsKvCache } = require('@iptop/node-fs-cache');

// 创建缓存实例
const cache = new FsKvCache('./cache');

// 自定义目录层数 (2-5层，默认3层)
const cache2 = new FsKvCache('./cache', { depth: 2 });

// 存储数据
cache.setItem('username', 'john_doe');

// 读取数据
const value = cache.getItem('username');
console.log(value); // 'john_doe'

// 检查键是否存在
const exists = cache.hasItem('username');
console.log(exists); // true

// 删除数据
cache.removeItem('username');
```

## API

### `new FsKvCache(basePath, options?)`

创建缓存实例。

- `basePath` - 缓存文件存储的根目录路径
- `options.depth` - 目录层数，范围 2-5，默认 3

### `setItem(key, value)`

存储键值对。

- `key` - 字符串类型的键名
- `value` - 任意可序列化的值

### `getItem(key)`

获取指定键的值。

- `key` - 字符串类型的键名
- 返回值：存储的值，如果键不存在则返回 `null`

### `hasItem(key)`

检查键是否存在。

- `key` - 字符串类型的键名
- 返回值：`boolean`

### `removeItem(key)`

删除指定键值对。

- `key` - 字符串类型的键名

## 存储原理

### MD5 哈希分片策略

为避免单个文件夹下文件数量过多，采用 MD5 哈希分片存储：

1. 对 key 进行 MD5 加密
   - 例如：`username` → `14c4b06b824ec593239362517f538b29`

2. 根据 depth 创建嵌套目录结构（默认 3 层）
   - depth=2: `cache/1/4.pack` (最多 256 个文件)
   - depth=3: `cache/1/4/c.pack` (最多 4,096 个文件)
   - depth=4: `cache/1/4/c/4.pack` (最多 65,536 个文件)
   - depth=5: `cache/1/4/c/4/b.pack` (最多 1,048,576 个文件)

### 文件内容格式

使用 MessagePack 格式存储，文件内容为数组结构：

```javascript
[[md5Buffer, value], ...]  // md5Buffer 为 16 字节的二进制 Buffer
```

> **注意**：为最小化存储空间，缓存文件中不存储原始 key，仅存储 MD5 二进制和 value。因此本库不提供 key 遍历功能。

### 哈希冲突处理

当不同的 key 映射到同一个文件时（MD5 前几位相同），多个键值对会存储在同一个文件中，通过完整的 MD5 Buffer 进行区分。

## 设计限制

- ❌ 不支持 key 遍历（`keys()`、`entries()` 等）
- ❌ 不支持浏览器环境
- ❌ 不支持异步操作（同步 API）

## 依赖

- [msgpackr](https://github.com/kriszyp/msgpackr) - MessagePack 编解码

## 许可证

MIT
