"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, UserX } from "lucide-react";

interface UserActionsProps {
  userId: string;
  platformUserId: string;
  currentUserId: string;
}

export function UserActions({ userId, platformUserId, currentUserId }: UserActionsProps) {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/platform/users/${platformUserId}`);
  };

  const handleRevoke = async () => {
    if (!confirm("Are you sure you want to revoke this user's platform access?")) {
      return;
    }

    try {
      const response = await fetch(`/api/platform/users/${platformUserId}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to revoke access");
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Failed to revoke access");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewDetails}>
          View Details
        </DropdownMenuItem>
        {userId !== currentUserId && (
          <DropdownMenuItem onClick={handleRevoke} className="text-red-600">
            <UserX className="mr-2 h-4 w-4" />
            Revoke Access
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
