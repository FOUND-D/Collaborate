const redis = require('redis');

// Initialize Client (Adjust port/host as needed)
const redisClient = redis.createClient({
    username: 'default',
    password: 'hxYD81Yyu2MbC6WTXNkRbDYyqiIYTKc',
    socket: {
        host: 'redis-19602.c264.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 19602,
        tls: true,
        rejectUnauthorized: false
    }
});

redisClient.on('error', (err) => {
    console.error('--- REDIS CLIENT ERROR ---');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error('Error Code:', err.code);
    console.error('Error Message:', err.message);
    console.error('--- END REDIS CLIENT ERROR ---');
});

redisClient.on('reconnecting', () => {
    console.warn('--- REDIS CLIENT RECONNECTING ---');
    console.warn(`Timestamp: ${new Date().toISOString()}`);
    console.warn('--- END REDIS CLIENT RECONNECTING ---');
});

redisClient.on('ready', () => {
    console.log("✅ Redis client is ready and connected for Collaborate");
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('--- FAILED TO CONNECT TO REDIS ---');
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error('Error:', err);
        console.error('--- END FAILED TO CONNECT TO REDIS ---');
    }
})();

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

/**
 * reliableGetOrSet
 * 1. Checks Redis for the 'key'.
 * 2. If found, returns cached data.
 * 3. If NOT found, executes the 'fetchCallback' (the MongoDB query),
 * stores the result in Redis, and returns it.
 */
async function getOrSet(key, fetchCallback, ttl = DEFAULT_EXPIRATION) {
    try {
        const data = await redisClient.get(key);
        
        if (data != null) {
            console.log(`⚡ Cache HIT for ${key}`);
            return JSON.parse(data);
        }

        console.log(`🐢 Cache MISS for ${key} - Fetching from DB`);
        const freshData = await fetchCallback();

        // Only cache if data exists
        if (freshData) {
            await redisClient.setEx(key, ttl, JSON.stringify(freshData));
        }
        
        return freshData;
    } catch (error) {
        console.error(`--- CACHE SERVICE ERROR (getOrSet) ---`);
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error(`Key: ${key}`);
        console.error('Error:', error);
        console.error('--- END CACHE SERVICE ERROR ---');
        // Fallback: If Redis fails, just return the DB query directly
        return await fetchCallback(); 
    }
}

/**
 * invalidate
 * Removes a specific key or pattern when data changes
 */
async function invalidate(key) {
    try {
        await redisClient.del(key);
        console.log(`🗑️ Cache Invalidated: ${key}`);
    } catch (error) {
        console.error(`--- CACHE SERVICE ERROR (invalidate) ---`);
        console.error(`Timestamp: ${new Date().toISOString()}`);
        console.error(`Key: ${key}`);
        console.error('Error:', error);
        console.error('--- END CACHE SERVICE ERROR ---');
    }
}

module.exports = { getOrSet, invalidate, redisClient };
