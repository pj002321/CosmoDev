"use client";

import { UserButton } from "@clerk/nextjs";
import { SettingsIcon, UsersIcon } from "@/components/icons";

export default function UserMenu({
  settingsLabel,
  friendsLabel,
}: {
  settingsLabel: string;
  friendsLabel: string;
}) {
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
      </UserButton.MenuItems>
    </UserButton>
  );
}
