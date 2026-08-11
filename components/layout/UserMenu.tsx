"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { SettingsIcon, UsersIcon } from "@/components/icons";
import { isAdminEmail } from "@/lib/admin";

export default function UserMenu({
  settingsLabel,
  friendsLabel,
}: {
  settingsLabel: string;
  friendsLabel: string;
}) {
  const { user } = useUser();
  const isAdmin = isAdminEmail(user?.primaryEmailAddress?.emailAddress);

  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label={settingsLabel}
          href="/settings"
          labelIcon={<SettingsIcon className="w-4 h-4" />}
        />
        <UserButton.Link
          label={friendsLabel}
          href="/friends"
          labelIcon={<UsersIcon className="w-4 h-4" />}
        />
        {isAdmin && (
          <UserButton.Link
            label="문의 관리"
            href="/admin/inquiries"
            labelIcon={<UsersIcon className="w-4 h-4" />}
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  );
}
