-- Migration: Enable required extensions
-- Description: Enable uuid-ossp for UUID primary key generation

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
