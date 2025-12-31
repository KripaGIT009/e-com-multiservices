-- Initialize test users with different roles for testing

-- Insert ADMIN user
INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('admin', 'admin@example.com', 'Admin', 'User', 'ADMIN', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert CUSTOMER users
INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('customer1', 'customer1@example.com', 'John', 'Customer', 'CUSTOMER', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('customer2', 'customer2@example.com', 'Jane', 'Doe', 'CUSTOMER', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('customer3', 'customer3@example.com', 'Robert', 'Smith', 'CUSTOMER', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Insert GUEST users (if applicable)
INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('guest1', 'guest1@example.com', 'Guest', 'User', 'GUEST', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, first_name, last_name, role, created_at, updated_at) 
VALUES ('guest2', 'guest2@example.com', 'Guest', 'Browser', 'GUEST', NOW(), NOW())
ON CONFLICT (username) DO NOTHING;

-- Verify inserted users
SELECT id, username, email, role FROM users ORDER BY id;
