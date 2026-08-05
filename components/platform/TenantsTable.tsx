// Tenants Table Component
// Displays list of tenants with status and actions

"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Settings, AlertTriangle, Users } from "lucide-react";

interface Tenant {
  id: string;
  name: string;
  code: string;
  status: string;
  created_at: string;
  tenant_subscriptions: {
    status: string;
    plan_id: string;
    effective_date: string;
    grace_period_ends_at: string | null;
    plans: {
      name: string;
      code: string;
    };
  }[];
}

interface TenantsTableProps {
  tenants: Tenant[];
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    trialing: "secondary",
    past_due: "destructive",
    suspended: "destructive",
    cancelled: "outline",
  };
  return <Badge variant={variants[status] || "default"}>{status}</Badge>;
};

export function TenantsTable({ tenants }: TenantsTableProps) {
  const router = useRouter();
  
  if (tenants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No tenants found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => {
            const subscription = tenant.tenant_subscriptions?.[0];
            const isPastDue = subscription?.status === "past_due";

            return (
              <TableRow key={tenant.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{tenant.name}</p>
                    <p className="text-sm text-gray-500">{tenant.code}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(tenant.status)}
                    {isPastDue && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {subscription ? (
                    <div>
                      <p className="text-sm">{subscription.plans?.name}</p>
                      <p className="text-xs text-gray-500">
                        {subscription.status}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-400">No subscription</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(tenant.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/platform/tenants/${tenant.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/platform/tenants/${tenant.id}/edit`)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/platform/tenants/${tenant.id}/users`)}>
                        <Users className="mr-2 h-4 w-4" />
                        Manage Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
