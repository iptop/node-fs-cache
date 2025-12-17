import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { Packr } from 'msgpackr';

const packr = new Packr({ useRecords: false });

export class FsKvCache {
  /**
   * @param {string} basePath - 缓存文件存储的根目录路径
   * @param {object} [options] - 配置选项
   * @param {number} [options.depth=3] - 目录层数 (2-5)
   */
  constructor(basePath, options = {}) {
    this.basePath = basePath;
    this.depth = Math.min(5, Math.max(2, options.depth ?? 3));
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
  }

  /**
   * 计算 key 的 MD5 哈希值（返回 Buffer）
   * @param {string} key
   * @returns {{ hex: string, buffer: Buffer }}
   */
  _getMd5(key) {
    const hash = createHash('md5').update(key);
    return {
      hex: hash.copy().digest('hex'),
      buffer: hash.digest(),
    };
  }

  /**
   * 根据 MD5 hex 获取文件路径
   * @param {string} hex
   * @returns {string}
   */
  _getFilePath(hex) {
    const parts = [];
    for (let i = 0; i < this.depth - 1; i++) {
      parts.push(hex[i]);
    }
    parts.push(hex[this.depth - 1] + '.pack');
    return join(this.basePath, ...parts);
  }

  /**
   * 读取文件内容
   * @param {string} filePath
   * @returns {Array|null} 返回 [[buffer, value], ...] 数组
   */
  _readFile(filePath) {
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      const buffer = readFileSync(filePath);
      return packr.unpack(buffer);
    } catch {
      return null;
    }
  }

  /**
   * 写入文件内容
   * @param {string} filePath
   * @param {Array} data [[buffer, value], ...]
   */
  _writeFile(filePath, data) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const buffer = packr.pack(data);
    writeFileSync(filePath, buffer);
  }

  /**
   * 在数据数组中查找 key
   * @param {Array} data
   * @param {Buffer} keyBuffer
   * @returns {number} 索引，未找到返回 -1
   */
  _findIndex(data, keyBuffer) {
    if (!data) return -1;
    return data.findIndex(([k]) => keyBuffer.equals(k));
  }

  /**
   * 存储键值对
   * @param {string} key
   * @param {*} value
   */
  setItem(key, value) {
    const { hex, buffer: keyBuffer } = this._getMd5(key);
    const filePath = this._getFilePath(hex);
    const data = this._readFile(filePath) || [];
    const index = this._findIndex(data, keyBuffer);
    if (index >= 0) {
      data[index][1] = value;
    } else {
      data.push([keyBuffer, value]);
    }
    this._writeFile(filePath, data);
  }

  /**
   * 获取指定键的值
   * @param {string} key
   * @returns {*} 存储的值，如果键不存在则返回 null
   */
  getItem(key) {
    const { hex, buffer: keyBuffer } = this._getMd5(key);
    const filePath = this._getFilePath(hex);
    const data = this._readFile(filePath);
    const index = this._findIndex(data, keyBuffer);
    return index >= 0 ? data[index][1] : null;
  }

  /**
   * 检查键是否存在
   * @param {string} key
   * @returns {boolean}
   */
  hasItem(key) {
    const { hex, buffer: keyBuffer } = this._getMd5(key);
    const filePath = this._getFilePath(hex);
    const data = this._readFile(filePath);
    return this._findIndex(data, keyBuffer) >= 0;
  }

  /**
   * 删除指定键值对
   * @param {string} key
   */
  removeItem(key) {
    const { hex, buffer: keyBuffer } = this._getMd5(key);
    const filePath = this._getFilePath(hex);
    const data = this._readFile(filePath);
    const index = this._findIndex(data, keyBuffer);
    if (index >= 0) {
      data.splice(index, 1);
      if (data.length === 0) {
        try {
          unlinkSync(filePath);
        } catch {
          // ignore
        }
      } else {
        this._writeFile(filePath, data);
      }
    }
  }
}

export default FsKvCache;
