-- Initialize Umami database with proper encoding
-- This script runs when the database container starts

-- Create the umami user if it doesn't exist
DO $$ BEGIN
    CREATE ROLE umami WITH LOGIN PASSWORD 'your_secure_password_here';
EXCEPTION
    WHEN duplicate_object THEN
        -- User already exists, do nothing
END $$;

-- Grant permissions to the umami user
GRANT ALL PRIVILEGES ON DATABASE umami TO umami;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO umami;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO umami;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO umami;
