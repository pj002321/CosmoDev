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

console.log("migrated");
