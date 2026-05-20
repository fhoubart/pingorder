-- PingOrder Database Schema
DROP TABLE IF EXISTS orders;

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    items JSONB NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Seed some initial data if needed
-- INSERT INTO orders (username, items, total, status) VALUES ('admin', '[]', 0, 'New');
