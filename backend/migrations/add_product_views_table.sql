-- Creates an append-only log of every product view
CREATE TABLE IF NOT EXISTS product_views (
    id          BIGSERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     INTEGER REFERENCES users(id),
    ip_hash     TEXT,
    viewed_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON product_views(product_id);
CREATE INDEX IF NOT EXISTS product_views_viewed_at_idx  ON product_views(viewed_at); 