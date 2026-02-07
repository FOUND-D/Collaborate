const redis = require('redis');

// Initialize Client
const redisClient = redis.createClient({
    username: 'default',
    password: 'hxYD81Yyu2MbC6WTXNkRbDYyqiIYTKc', // Your password
    socket: {
        // UPDATED HOST:
        host: 'redis-19707.c330.asia-south1-1.gce.cloud.redislabs.com',
        // UPDATED PORT:
        port: 19707,
        
        // KEEP TLS SETTINGS:
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
});

redisClient.on('ready', () => {
    console.log("✅ Redis client is ready and connected for Collaborate");
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('--- FAILED TO CONNECT TO REDIS ---');
        console.error('Error:', err);
    }
})();

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

async function getOrSet(key, fetchCallback, ttl = DEFAULT_EXPIRATION) {
    try {
        const data = await redisClient.get(key);
        
        if (data != null) {
            console.log(`⚡ Cache HIT for ${key}`);
            return JSON.parse(data);
        }

        console.log(`🐢 Cache MISS for ${key} - Fetching from DB`);
        const freshData = await fetchCallback();

        if (freshData) {
            await redisClient.setEx(key, ttl, JSON.stringify(freshData));
        }
        
        return freshData;
    } catch (error) {
        console.error(`--- CACHE SERVICE ERROR (getOrSet) ---`);
        console.error(`Key: ${key}`);
        console.error('Error:', error);
        // Fallback: If Redis fails, just return the DB query directly
        return await fetchCallback(); 
    }
}

async function invalidate(key) {
    try {
        await redisClient.del(key);
        console.log(`🗑️ Cache Invalidated: ${key}`);
    } catch (error) {
        console.error(`--- CACHE SERVICE ERROR (invalidate) ---`);
        console.error('Error:', error);
    }
}

module.exports = { getOrSet, invalidate, redisClient };
