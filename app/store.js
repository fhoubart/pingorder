const { Pool } = require('pg');
const Redis = require('ioredis');

/**
 * store.js
 * 
 * This file handles data persistence for both Postgres (Orders/Products)
 * and Redis (Sessions/Metrics).
 * 
 * It is designed to be resilient but also to fail visibly when 
 * infrastructure is offline.
 */

// Postgres Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pingorder',
    connectionTimeoutMillis: 2000, // Fail fast for educational purposes
});

// Redis Connection
let redis = null;
if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        connectTimeout: 1000,
        maxRetriesPerRequest: 1
    });
    console.log(`[Store] Redis connected at ${process.env.REDIS_URL}`);
}

const products = [
    { id: 1, name: 'Salmon', price: 25 },
    { id: 2, name: 'Tuna', price: 30 },
    { id: 3, name: 'Cod', price: 18 },
    { id: 4, name: 'Sardines', price: 12 },
    { id: 5, name: 'Lobster', price: 50 },
];

async function getProducts() {
    return products;
}

async function createOrder(username, items) {
    const client = await pool.connect();
    try {
        const total = items.reduce((sum, item) => sum + item.price, 0);
        const res = await client.query(
            'INSERT INTO orders (username, items, total, status) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, JSON.stringify(items), total, 'New']
        );
        return res.rows[0].id;
    } finally {
        client.release();
    }
}

async function getOrders() {
    const res = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    return res.rows;
}

async function getOrdersForUser(username) {
    const res = await pool.query('SELECT * FROM orders WHERE username = $1 ORDER BY created_at DESC', [username]);
    return res.rows;
}

async function updateOrderStatus(id, status) {
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
}

async function getDbStatus() {
    try {
        await pool.query('SELECT 1');
        return 'Connected';
    } catch (e) {
        return 'Disconnected: ' + e.message;
    }
}

async function getRedisStatus() {
    if (!redis) return 'Not Configured';
    try {
        await redis.ping();
        return 'Connected';
    } catch (e) {
        return 'Disconnected: ' + e.message;
    }
}

module.exports = {
    getProducts,
    createOrder,
    getOrders,
    getOrdersForUser,
    updateOrderStatus,
    getDbStatus,
    getRedisStatus,
    redis,
    pool
};
