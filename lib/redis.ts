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

export const redisDel = cacheDel;

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

export async function redisSCard(key: string): Promise<number> {
  try {
    const client = await getRedisClient();
    if (!client) return 0;
    return await client.sCard(key);
  } catch (err) {
    console.warn(`[Redis sCard] Failed for key "${key}":`, err);
    return 0;
  }
}

/**
 * List operations for user activity and search history
 */
export async function redisLPush(key: string, value: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.lPush(key, value);
    return true;
  } catch (err) {
    console.warn(`[Redis lPush] Failed for key "${key}":`, err);
    return false;
  }
}

export async function redisLRange(key: string, start: number, stop: number): Promise<string[]> {
  try {
    const client = await getRedisClient();
    if (!client) return [];
    return await client.lRange(key, start, stop);
  } catch (err) {
    console.warn(`[Redis lRange] Failed for key "${key}":`, err);
    return [];
  }
}

export async function redisLTrim(key: string, start: number, stop: number): Promise<boolean> {
  try {
    const client = await getRedisClient();
    if (!client) return false;
    await client.lTrim(key, start, stop);
    return true;
  } catch (err) {
    console.warn(`[Redis lTrim] Failed for key "${key}":`, err);
    return false;
  }
}

export interface UserActivityItem {
  id?: string;
  activity_type: string;
  description: string;
  details?: any;
  created_at: string;
}

export async function logUserActivity(
  userId: string,
  activity: { activity_type: string; description: string; details?: any }
): Promise<void> {
  try {
    const item: UserActivityItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      activity_type: activity.activity_type,
      description: activity.description,
      details: activity.details || null,
      created_at: new Date().toISOString(),
    };
    const key = `notes_club:activities:${userId}`;
    await redisLPush(key, JSON.stringify(item));
    await redisLTrim(key, 0, 99); // Keep latest 100 activities
  } catch (err) {
    console.warn(`[logUserActivity] Failed for user "${userId}":`, err);
  }
}

export async function getUserActivities(userId: string, limit: number = 50): Promise<UserActivityItem[]> {
  try {
    const key = `notes_club:activities:${userId}`;
    const raw = await redisLRange(key, 0, limit - 1);
    return raw.map((r) => {
      try {
        return JSON.parse(r);
      } catch {
        return {
          activity_type: "general",
          description: r,
          created_at: new Date().toISOString(),
        };
      }
    });
  } catch (err) {
    console.warn(`[getUserActivities] Failed for user "${userId}":`, err);
    return [];
  }
}

export interface UserSearchItem {
  id?: string;
  query: string;
  created_at: string;
}

export async function logUserSearch(userId: string, query: string): Promise<void> {
  try {
    const item: UserSearchItem = {
      id: `srch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      query,
      created_at: new Date().toISOString(),
    };
    const key = `notes_club:searches:${userId}`;
    await redisLPush(key, JSON.stringify(item));
    await redisLTrim(key, 0, 99); // Keep latest 100 searches

    // Also record in activity feed
    await logUserActivity(userId, {
      activity_type: "search",
      description: `Searched for "${query}"`,
      details: { query },
    });
  } catch (err) {
    console.warn(`[logUserSearch] Failed for user "${userId}":`, err);
  }
}

export async function getUserSearches(userId: string, limit: number = 50): Promise<UserSearchItem[]> {
  try {
    const key = `notes_club:searches:${userId}`;
    const raw = await redisLRange(key, 0, limit - 1);
    return raw.map((r) => {
      try {
        return JSON.parse(r);
      } catch {
        return {
          query: r,
          created_at: new Date().toISOString(),
        };
      }
    });
  } catch (err) {
    console.warn(`[getUserSearches] Failed for user "${userId}":`, err);
    return [];
  }
}

export async function clearUserSearches(userId: string): Promise<boolean> {
  try {
    const key = `notes_club:searches:${userId}`;
    const client = await getRedisClient();
    if (!client) return false;
    await client.del(key);
    return true;
  } catch (err) {
    console.warn(`[clearUserSearches] Failed for user "${userId}":`, err);
    return false;
  }
}

export async function deleteUserSearch(userId: string, targetQuery: string): Promise<boolean> {
  try {
    const key = `notes_club:searches:${userId}`;
    const searches = await getUserSearches(userId, 100);
    const filtered = searches.filter((s) => s.query.toLowerCase() !== targetQuery.toLowerCase());
    const client = await getRedisClient();
    if (!client) return false;
    await client.del(key);
    for (let i = filtered.length - 1; i >= 0; i--) {
      await redisLPush(key, JSON.stringify(filtered[i]));
    }
    return true;
  } catch (err) {
    console.warn(`[deleteUserSearch] Failed for user "${userId}":`, err);
    return false;
  }
}
