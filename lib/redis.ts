import { createClient, RedisClientType } from "redis";

// Global singleton for Next.js hot reload safety
declare global {
  // eslint-disable-next-line no-var
  var __redisClient: RedisClientType | undefined;
}

let redisClient: RedisClientType | null = null;
let isConnecting = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (global.__redisClient && global.__redisClient.isOpen) {
    return global.__redisClient;
  }

  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (isConnecting) {
    // Wait briefly for active connection attempt
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (global.__redisClient?.isOpen) return global.__redisClient;
    }
  }

  const host = process.env.REDIS_HOST || "better-hypersoft-potato-25997.db.redis.io";
  const port = parseInt(process.env.REDIS_PORT || "17082", 10);
  const password = process.env.REDIS_PASSWORD || "zQwGO4v8E9S3xxZ8m3DQlgDUAJqS46zZ";
  const username = process.env.REDIS_USERNAME || "default";

  try {
    isConnecting = true;
    const client: RedisClientType = createClient({
      username,
      password,
      socket: {
        host,
        port,
        reconnectStrategy: (retries) => {
          if (retries > 10) return false;
          return Math.min(retries * 100, 3000);
        },
      },
    });

    client.on("error", (err) => {
      console.warn("[Redis Cache Error]", err?.message || err);
    });

    await client.connect();
    redisClient = client;
    global.__redisClient = client;
    return client;
  } catch (err: any) {
    console.warn("[Redis] Connection failed, falling back to database direct query:", err?.message || err);
    return null;
  } finally {
    isConnecting = false;
  }
}

/**
 * Get cached JSON value by key
 */
export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    if (!client) return null;

    const data = await client.get(key);
    if (!data) return null;

    return JSON.parse(data) as T;
  } catch (err) {
    console.warn(`[Redis cacheGet] Failed for key "${key}":`, err);
    return null;
  }
}

/**
 * Set cached value with TTL (default 10 minutes)
 */
export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 600
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;

    const serialized = JSON.stringify(value);
    await client.set(key, serialized, { EX: ttlSeconds });
    return true;
  } catch (err) {
    console.warn(`[Redis cacheSet] Failed for key "${key}":`, err);
    return false;
  }
}

/**
 * Invalidate a key or pattern
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    await client.del(key);
  } catch (err) {
    console.warn(`[Redis cacheDel] Failed for key "${key}":`, err);
  }
}

/**
 * Invalidate all keys matching a prefix (e.g. "notes_club:docs:*")
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) return;

    const keys = await client.keys(`${prefix}*`);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch (err) {
    console.warn(`[Redis cacheInvalidatePrefix] Failed for prefix "${prefix}":`, err);
  }
}

/**
 * Set operations for user favorites / tags
 */
export async function redisSAdd(key: string, member: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.sAdd(key, member);
    return true;
  } catch (err) {
    console.warn(`[Redis sAdd] Failed for key "${key}":`, err);
    return false;
  }
}

export async function redisSRem(key: string, member: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.sRem(key, member);
    return true;
  } catch (err) {
    console.warn(`[Redis sRem] Failed for key "${key}":`, err);
    return false;
  }
}

export async function redisSMembers(key: string): Promise<string[]> {
  try {
    const client = await getRedisClient();
    if (!client) return [];
    return await client.sMembers(key);
  } catch (err) {
    console.warn(`[Redis sMembers] Failed for key "${key}":`, err);
    return [];
  }
}

export async function redisSIsMember(key: string, member: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    const res = await client.sIsMember(key, member);
    return Boolean(res);
  } catch (err) {
    console.warn(`[Redis sIsMember] Failed for key "${key}":`, err);
    return false;
  }
}
