"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { markNotificationReadAction } from "@/app/[locale]/company/notification-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
};

export function NotificationBell({
  unreadCount,
  items,
}: {
  unreadCount: number;
  items: NotificationItem[];
}) {
  const [, startTransition] = useTransition();
  const [localItems, setLocalItems] = useState(items);
  const [localCount, setLocalCount] = useState(unreadCount);

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      setLocalItems((prev) => prev.filter((n) => n.id !== id));
      setLocalCount((c) => Math.max(0, c - 1));
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon-sm" className="relative">
            <Bell className="size-4" />
            {localCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">
                {localCount > 9 ? "9+" : localCount}
              </span>
            ) : null}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {localItems.length === 0 ? (
          <p className="text-muted-foreground px-2 py-3 text-sm">
            Aucune notification non lue.
          </p>
        ) : (
          localItems.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-0.5"
              onClick={() => markRead(n.id)}
            >
              <span className="font-medium">{n.title}</span>
              <span className="text-muted-foreground text-xs">{n.body}</span>
              {n.href ? (
                <Link
                  href={n.href}
                  className="text-brand mt-1 text-xs hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Voir
                </Link>
              ) : null}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
