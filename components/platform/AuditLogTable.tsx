"use client";

import * as React from "react";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, MoreHorizontal, Filter, Download } from "lucide-react";

export interface AuditEvent {
  id: string;
  actor_type: "user" | "system" | "api" | "integration";
  actor_id: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  category: string;
  target_type: string;
  target_id: string;
  target_name?: string;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AuditLogTableProps {
  events: AuditEvent[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  login: "default",
  logout: "outline",
  export: "secondary",
  import: "secondary",
  sync: "default",
  approve: "default",
  reject: "destructive",
};

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-blue-100 text-blue-800",
  user: "bg-green-100 text-green-800",
  tenant: "bg-purple-100 text-purple-800",
  property: "bg-orange-100 text-orange-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  billing: "bg-pink-100 text-pink-800",
  integration: "bg-indigo-100 text-indigo-800",
  system: "bg-gray-100 text-gray-800",
};

function JsonDiff({ previous, current }: { previous: Record<string, unknown> | null; current: Record<string, unknown> | null }) {
  if (!previous && !current) return <span className="text-muted-foreground">No data</span>;

  const allKeys = new Set([...Object.keys(previous || {}), ...Object.keys(current || {})]);

  return (
    <div className="space-y-1 text-sm">
      {Array.from(allKeys).map((key) => {
        const oldVal = previous?.[key];
        const newVal = current?.[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

        return (
          <div key={key} className="grid grid-cols-3 gap-2">
            <span className="font-medium text-gray-600">{key}:</span>
            <span className={changed ? "text-red-600 line-through" : "text-gray-500"}>
              {oldVal === undefined ? "—" : JSON.stringify(oldVal)}
            </span>
            <span className={changed ? "text-green-600 font-medium" : "text-gray-500"}>
              {newVal === undefined ? "—" : JSON.stringify(newVal)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AuditLogTable({
  events,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: AuditLogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredEvents = events.filter((event) => {
    if (filterCategory && event.category !== filterCategory) return false;
    if (filterAction && event.action !== filterAction) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        event.actor_name?.toLowerCase().includes(search) ||
        event.actor_email?.toLowerCase().includes(search) ||
        event.target_name?.toLowerCase().includes(search) ||
        event.action.toLowerCase().includes(search) ||
        event.category.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(events.map((e) => e.category)));
  const actions = Array.from(new Set(events.map((e) => e.action)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by actor, target, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilterCategory("");
              setFilterAction("");
              setSearchTerm("");
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">&nbsp;</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No audit events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const isExpanded = expandedRows.has(event.id);
                return (
                  <React.Fragment key={event.id}>
                    <TableRow>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(event.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.actor_name || event.actor_id}</p>
                          {event.actor_email && (
                            <p className="text-xs text-muted-foreground">{event.actor_email}</p>
                          )}
                          <Badge variant="outline" className="text-xs mt-1">
                            {event.actor_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ACTION_COLORS[event.action] || "default"}>
                          {event.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            CATEGORY_COLORS[event.category] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.category}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{event.target_name || event.target_id}</p>
                          <p className="text-xs text-muted-foreground">{event.target_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleRow(event.id)}>
                              {isExpanded ? "Hide Details" : "View Details"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Changes</h4>
                              <div className="bg-white p-3 rounded border">
                                <JsonDiff
                                  previous={event.previous_values}
                                  current={event.new_values}
                                />
                              </div>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div>
                                <h4 className="font-medium mb-2">Metadata</h4>
                                <pre className="bg-white p-3 rounded border text-xs overflow-auto">
                                  {JSON.stringify(event.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                            {(event.ip_address || event.user_agent) && (
                              <div className="text-xs text-muted-foreground">
                                {event.ip_address && <span>IP: {event.ip_address}</span>}
                                {event.ip_address && event.user_agent && <span> | </span>}
                                {event.user_agent && <span>UA: {event.user_agent}</span>}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={onLoadMore} disabled={isLoading} variant="outline">
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
