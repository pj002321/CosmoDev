import { sql } from "@/lib/db";

export type Friend = {
  followeeId: string;
  followeeName: string;
};

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const rows = (await sql()`
    SELECT 1 FROM follows WHERE follower_id = ${followerId} AND followee_id = ${followeeId} LIMIT 1
  `) as unknown[];
  return rows.length > 0;
}

export async function follow(followerId: string, followeeId: string, followeeName: string) {
  if (followerId === followeeId) return;
  await sql()`
    INSERT INTO follows (follower_id, followee_id, followee_name)
    VALUES (${followerId}, ${followeeId}, ${followeeName})
    ON CONFLICT (follower_id, followee_id) DO UPDATE SET followee_name = EXCLUDED.followee_name
  `;
}

export async function unfollow(followerId: string, followeeId: string) {
  await sql()`
    DELETE FROM follows WHERE follower_id = ${followerId} AND followee_id = ${followeeId}
  `;
}

export async function getFriends(followerId: string): Promise<Friend[]> {
  const rows = (await sql()`
    SELECT followee_id, followee_name FROM follows
    WHERE follower_id = ${followerId} ORDER BY created_at DESC
  `) as { followee_id: string; followee_name: string }[];
  return rows.map((r) => ({ followeeId: r.followee_id, followeeName: r.followee_name }));
}
