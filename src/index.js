import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pack, unpack } from 'msgpackr';

export class FsKvCache {
  /**
   * @param {string} basePath - 缓存文件存储的根目录路径
   */
  constructor(basePath) {
    this.basePath = basePath;
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
  }

  /**
   * 计算 key 的 MD5 哈希值
   * @param {string} key
   * @returns {string}
   */
  _getMd5(key) {
    return createHash('md5').update(key).digest('hex');
  }

  /**
   * 根据 MD5 获取文件路径
   * @param {string} md5
   * @returns {string}
   */
  _getFilePath(md5) {
    const dir1 = md5[0];
    const dir2 = md5[1];
    const dir3 = md5[2];
    const fileName = md5[3] + '.pack';
    return join(this.basePath, dir1, dir2, dir3, fileName);
  }

  /**
   * 读取文件内容
   * @param {string} filePath
   * @returns {Object|null}
   */
  _readFile(filePath) {
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      const buffer = readFileSync(filePath);
      return unpack(buffer);
    } catch {
      return null;
    }
  }

  /**
   * 写入文件内容
   * @param {string} filePath
   * @param {Object} data
   */
  _writeFile(filePath, data) {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const buffer = pack(data);
    writeFileSync(filePath, buffer);
  }

  /**
   * 存储键值对
   * @param {string} key
   * @param {*} value
   */
  setItem(key, value) {
    const md5 = this._getMd5(key);
    const filePath = this._getFilePath(md5);
    const data = this._readFile(filePath) || {};
    data[md5] = value;
    this._writeFile(filePath, data);
  }

  /**
   * 获取指定键的值
   * @param {string} key
   * @returns {*} 存储的值，如果键不存在则返回 null
   */
  getItem(key) {
    const md5 = this._getMd5(key);
    const filePath = this._getFilePath(md5);
    const data = this._readFile(filePath);
    if (data && md5 in data) {
      return data[md5];
    }
    return null;
  }

  /**
   * 检查键是否存在
   * @param {string} key
   * @returns {boolean}
   */
  hasItem(key) {
    const md5 = this._getMd5(key);
    const filePath = this._getFilePath(md5);
    const data = this._readFile(filePath);
    return data !== null && md5 in data;
  }

  /**
   * 删除指定键值对
   * @param {string} key
   */
  removeItem(key) {
    const md5 = this._getMd5(key);
    const filePath = this._getFilePath(md5);
    const data = this._readFile(filePath);
    if (data && md5 in data) {
      delete data[md5];
      if (Object.keys(data).length === 0) {
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
