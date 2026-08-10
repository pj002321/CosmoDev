import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getFriends } from "@/lib/follows";
import { UserIcon } from "@/components/icons";
import FollowButton from "@/components/friends/FollowButton";
import AddFriendSearch from "@/components/friends/AddFriendSearch";
import Link from "next/link";
import { LOCALE_COOKIE, getDict, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const cookieStore = await cookies();
  const locale: Locale = cookieStore.get(LOCALE_COOKIE)?.value === "en" ? "en" : "ko";
  const dict = getDict(locale).friends;
  const friends = await getFriends(userId);

  return (
    <div>
      <p className="font-mono text-xs text-muted mb-2 animate-fade-in">▸ {dict.eyebrow}</p>
      <h1 className="text-2xl font-semibold mb-8">{dict.title}</h1>

      <AddFriendSearch />

      <div className="flex flex-col gap-3">
        {friends.map((friend) => (
          <div
            key={friend.followeeId}
            className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 bg-surface"
          >
            <Link href={`/u/${friend.followeeId}`} className="flex items-center gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-full border border-border text-accent">
                <UserIcon className="w-4 h-4" />
              </span>
              <span className="text-sm font-medium">{friend.followeeName}</span>
            </Link>
            <FollowButton followeeId={friend.followeeId} followeeName={friend.followeeName} initialFollowing={true} />
          </div>
        ))}
        {friends.length === 0 && <p className="text-sm text-muted">{dict.empty}</p>}
      </div>
    </div>
  );
}
