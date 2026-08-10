import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS posts (
    id serial PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    summary text NOT NULL DEFAULT '',
    content text NOT NULL,
    tags text[] NOT NULL DEFAULT '{}',
    author_id text NOT NULL,
    author_name text NOT NULL,
    date text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS profiles (
    author_id text PRIMARY KEY,
    tagline text NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS likes (
    post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    user_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (post_slug, user_id)
  )
`;

await sql`
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0
`;

await sql`
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published'
`;

await sql`
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
`;

await sql`
  CREATE TABLE IF NOT EXISTS follows (
    follower_id text NOT NULL,
    followee_id text NOT NULL,
    followee_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS comments (
    id serial PRIMARY KEY,
    post_slug text NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
    author_id text NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text
`;

await sql`
  ALTER TABLE posts ADD COLUMN IF NOT EXISTS thumbnail text
`;

await sql`
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_position integer NOT NULL DEFAULT 50
`;

await sql`
  CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    recipient_id text NOT NULL,
    actor_id text NOT NULL,
    actor_name text NOT NULL,
    type text NOT NULL,
    post_slug text,
    post_title text,
    read boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
  )
`;

await sql`
  CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_id, created_at DESC)
`;

console.log("migrated");
