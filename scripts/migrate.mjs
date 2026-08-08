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
  CREATE TABLE IF NOT EXISTS follows (
    follower_id text NOT NULL,
    followee_id text NOT NULL,
    followee_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id)
  )
`;

console.log("migrated");
