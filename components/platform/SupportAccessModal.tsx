"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  LogOut,
  Eye,
  User,
  Building,
} from "lucide-react";

export interface SupportSession {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  support_user_id: string;
  support_user_name: string;
  support_user_email: string;
  reason: string;
  expires_at: string;
  created_at: string;
  accessed_at?: string;
  is_active: boolean;
}

export interface SupportAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: {
    id: string;
    name: string;
    code: string;
    status: string;
  }[];
  activeSessions: SupportSession[];
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  onRequestAccess: (data: {
    tenant_id: string;
    reason: string;
    expiration_minutes: number;
  }) => void;
  onRevokeSession: (sessionId: string) => void;
  onEnterSession: (sessionId: string) => void;
  isLoading?: boolean;
}

const EXPIRATION_OPTIONS = [
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
  { value: 480, label: "8 hours" },
  { value: 1440, label: "24 hours" },
];

export function SupportAccessModal({
  isOpen,
  onClose,
  tenants,
  activeSessions,
  currentUser,
  onRequestAccess,
  onRevokeSession,
  onEnterSession,
  isLoading = false,
}: SupportAccessModalProps) {
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [reason, setReason] = useState("");
  const [expirationMinutes, setExpirationMinutes] = useState(60);
  const [activeTab, setActiveTab] = useState<"request" | "sessions">("request");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId || !reason) return;

    onRequestAccess({
      tenant_id: selectedTenantId,
      reason,
      expiration_minutes: expirationMinutes,
    });

    // Reset form
    setSelectedTenantId("");
    setReason("");
    setExpirationMinutes(60);
  };

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId);
  const userActiveSessions = activeSessions.filter(
    (s) => s.support_user_id === currentUser.id && s.is_active
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support Access</DialogTitle>
          <DialogDescription>
            Request temporary access to tenant accounts for support purposes.
          </DialogDescription>
        </DialogHeader>

        <div className="flex space-x-4 border-b mb-4">
          <button
            className={`pb-2 px-1 ${
              activeTab === "request"
                ? "border-b-2 border-[var(--teal)] font-medium"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("request")}
          >
            Request Access
          </button>
          <button
            className={`pb-2 px-1 ${
              activeTab === "sessions"
                ? "border-b-2 border-[var(--teal)] font-medium"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab("sessions")}
          >
            Active Sessions ({userActiveSessions.length})
          </button>
        </div>

        {activeTab === "request" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Select Tenant *</Label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants
                    .filter((t) => t.status === "active")
                    .map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          {tenant.name} ({tenant.code})
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedTenant && (
                <p className="text-xs text-muted-foreground">
                  Tenant Code: {selectedTenant.code} | Status:{" "}
                  <Badge variant="outline" className="ml-1">
                    {selectedTenant.status}
                  </Badge>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Access *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need access to this tenant account..."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Access Duration *</Label>
              <Select
                value={expirationMinutes.toString()}
                onValueChange={(v) => setExpirationMinutes(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important Notice</p>
                <p>
                  Your access will be logged and audited. All actions performed while accessing
                  tenant data will be recorded. Please only access accounts when necessary for
                  support purposes.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedTenantId || !reason || isLoading}
              >
                {isLoading ? "Requesting..." : "Request Access"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            {userActiveSessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active support sessions</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActiveSessions.map((session) => {
                      const isExpiringSoon =
                        new Date(session.expires_at).getTime() - Date.now() < 30 * 60 * 1000;

                      return (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{session.tenant_name}</p>
                              <p className="text-xs text-muted-foreground">{session.tenant_code}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className={`h-4 w-4 ${isExpiringSoon ? "text-red-500" : ""}`} />
                              <span className={isExpiringSoon ? "text-red-600 font-medium" : ""}>
                                {format(new Date(session.expires_at), "MMM d, HH:mm")}
                              </span>
                              {isExpiringSoon && (
                                <Badge variant="destructive" className="text-xs">
                                  Expiring
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm truncate max-w-[200px]" title={session.reason}>
                              {session.reason}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                onClick={() => onEnterSession(session.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Enter
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRevokeSession(session.id)}
                              >
                                <LogOut className="h-4 w-4 mr-1" />
                                Revoke
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <DialogFooter>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
