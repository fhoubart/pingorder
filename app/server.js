const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const path = require('path');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `app-${Math.random().toString(36).substr(2, 5)}`;

// HA Metrics & State
let metrics = {
    requestsServed: 0,
    queueDepth: 0,
    cpuStress: parseInt(process.env.CPU_STRESS || '1'),
    isChaosSlow: false
};

// Queue depth simulation middleware
app.use((req, res, next) => {
    // We don't count metrics requests to prevent the counter from spinning on its own
    if (req.path !== '/api/metrics') {
        metrics.requestsServed++;
    }
    
    metrics.queueDepth++;
    
    // Simulate latency based on queue depth
    const latency = (metrics.queueDepth > 10) ? (metrics.queueDepth - 10) * 100 : 0;
    
    // Chaos: Manual Slowness (Environmental)
    const extraLatency = metrics.isChaosSlow ? 2000 : 0;

    // Critical Overload Logic (simulates a real process being stuck)
    if (metrics.queueDepth > 50 && Math.random() > 0.7) {
        metrics.queueDepth--;
        return res.status(503).send('<h1>503 Service Unavailable</h1><p>Server overloaded (Queue Depth High)</p>');
    }

    setTimeout(() => {
        res.on('finish', () => {
            metrics.queueDepth--;
        });
        next();
    }, latency + extraLatency);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Configuration
const sessionConfig = {
    secret: 'pingorder-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // For local lab
        maxAge: 1000 * 60 * 60 // 1 hour
    }
};

if (process.env.SESSION_BACKEND === 'redis' && store.redis) {
    sessionConfig.store = new RedisStore({
        client: store.redis,
        prefix: "pingorder:sess:",
    });
}

app.use(session(sessionConfig));

// API Routes
app.post('/api/login', (req, res) => {
    req.session.username = req.body.username;
    res.json({ success: true, username: req.body.username });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/me', (req, res) => {
    res.json({ username: req.session.username });
});

app.get('/api/products', async (req, res) => {
    res.json(await store.getProducts());
});

app.post('/api/checkout', async (req, res) => {
    if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
    const orderId = await store.createOrder(req.session.username, req.body.items);
    res.json({ success: true, orderId });
});

app.get('/api/orders', async (req, res) => {
    res.json(await store.getOrders());
});

app.get('/api/my-orders', async (req, res) => {
    if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
    res.json(await store.getOrdersForUser(req.session.username));
});

app.post('/api/orders/:id/status', async (req, res) => {
    await store.updateOrderStatus(req.params.id, req.body.status);
    res.json({ success: true });
});

// Artificial Bottleneck Endpoint
app.get('/expensive', (req, res) => {
    const start = Date.now();
    let result = 0;
    const iterations = 1000000 * metrics.cpuStress;
    for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(Math.random());
    }
    const end = Date.now();
    res.json({ duration: `${end - start}ms`, instance: INSTANCE_ID });
});

// Chaos Routes
app.post('/chaos/crash', (req, res) => {
    console.log('!!! CHAOS: CRASHING PROCESS !!!');
    process.exit(1);
});

app.post('/chaos/slow', (req, res) => {
    metrics.isChaosSlow = !metrics.isChaosSlow;
    res.json({ isChaosSlow: metrics.isChaosSlow });
});

app.post('/chaos/cpu-max', (req, res) => {
    metrics.cpuStress = 100;
    res.json({ cpuStress: metrics.cpuStress });
});

app.post('/chaos/reset', (req, res) => {
    metrics.isChaosSlow = false;
    metrics.cpuStress = parseInt(process.env.CPU_STRESS || '1');
    res.json({ success: true });
});

// Metrics for Observability Dashboard
app.get('/api/metrics', async (req, res) => {
    res.json({
        instanceId: INSTANCE_ID,
        requestsServed: metrics.requestsServed,
        queueDepth: metrics.queueDepth,
        cpuStress: metrics.cpuStress,
        dbStatus: await store.getDbStatus(),
        redisStatus: await store.getRedisStatus(),
        overloadState: metrics.queueDepth > 40 ? 'CRITICAL' : (metrics.queueDepth > 10 ? 'WARNING' : 'HEALTHY'),
        sessionType: process.env.SESSION_BACKEND || 'memory'
    });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`[Server] PingOrder running (Instance: ${INSTANCE_ID})`);
});
