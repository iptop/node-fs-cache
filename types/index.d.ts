export interface FsKvCacheOptions {
  /** 目录层数 (2-5)，默认 3 */
  depth?: number;
}

/**
 * 基于文件系统的 Key-Value 缓存类
 */
export class FsKvCache {
  /**
   * 创建缓存实例
   * @param basePath - 缓存文件存储的根目录路径
   * @param options - 配置选项
   */
  constructor(basePath: string, options?: FsKvCacheOptions);

  /**
   * 存储键值对
   * @param key - 字符串类型的键名
   * @param value - 任意可序列化的值
   */
  setItem(key: string, value: unknown): void;

  /**
   * 获取指定键的值
   * @param key - 字符串类型的键名
   * @returns 存储的值，如果键不存在则返回 null
   */
  getItem<T = unknown>(key: string): T | null;

  /**
   * 检查键是否存在
   * @param key - 字符串类型的键名
   */
  hasItem(key: string): boolean;

  /**
   * 删除指定键值对
   * @param key - 字符串类型的键名
   */
  removeItem(key: string): void;
}

export default FsKvCache;
