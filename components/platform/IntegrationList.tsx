"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Link,
  Unlink,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

export interface AssociationIntegration {
  id: string;
  association_id: string;
  association_name: string;
  ghl_location_id?: string;
  ghl_location_name?: string;
  status: "connected" | "disconnected" | "error" | "pending";
  last_sync_at?: string;
  sync_status?: "idle" | "syncing" | "error" | "success";
  sync_error?: string;
  settings: {
    sync_contacts: boolean;
    sync_properties: boolean;
    sync_maintenance: boolean;
    sync_payments: boolean;
    webhook_url?: string;
  };
  created_at: string;
  updated_at: string;
}

interface IntegrationListProps {
  integrations: AssociationIntegration[];
  onToggleIntegration: (id: string, enabled: boolean) => void;
  onSyncNow: (id: string) => void;
  onDisconnect: (id: string) => void;
  onUpdateSettings: (id: string, settings: AssociationIntegration["settings"]) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  connected: { color: "bg-green-500", icon: CheckCircle, label: "Connected" },
  disconnected: { color: "bg-gray-400", icon: XCircle, label: "Disconnected" },
  error: { color: "bg-red-500", icon: AlertCircle, label: "Error" },
  pending: { color: "bg-yellow-500", icon: AlertCircle, label: "Pending" },
};

const SYNC_STATUS_CONFIG = {
  idle: { variant: "outline" as const, label: "Idle" },
  syncing: { variant: "default" as const, label: "Syncing" },
  error: { variant: "destructive" as const, label: "Error" },
  success: { variant: "default" as const, label: "Success" },
};

export function IntegrationList({
  integrations,
  onToggleIntegration,
  onSyncNow,
  onDisconnect,
  onUpdateSettings,
  isLoading = false,
}: IntegrationListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<AssociationIntegration | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [editingSettings, setEditingSettings] = useState<AssociationIntegration["settings"]>({
    sync_contacts: true,
    sync_properties: true,
    sync_maintenance: true,
    sync_payments: true,
  });

  const filteredIntegrations = integrations.filter(
    (integration) =>
      integration.association_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      integration.ghl_location_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenSettings = (integration: AssociationIntegration) => {
    setSelectedIntegration(integration);
    setEditingSettings(integration.settings);
    setShowSettingsDialog(true);
  };

  const handleSaveSettings = () => {
    if (selectedIntegration) {
      onUpdateSettings(selectedIntegration.id, editingSettings);
      setShowSettingsDialog(false);
      setSelectedIntegration(null);
    }
  };

  const handleDisconnectClick = (integration: AssociationIntegration) => {
    setSelectedIntegration(integration);
    setShowDisconnectDialog(true);
  };

  const handleConfirmDisconnect = () => {
    if (selectedIntegration) {
      onDisconnect(selectedIntegration.id);
      setShowDisconnectDialog(false);
      setSelectedIntegration(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredIntegrations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No integrations found</p>
            </CardContent>
          </Card>
        ) : (
          filteredIntegrations.map((integration) => {
            const statusConfig = STATUS_CONFIG[integration.status];
            const StatusIcon = statusConfig.icon;
            const syncStatus = integration.sync_status || "idle";

            return (
              <Card key={integration.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${statusConfig.color} text-white`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{integration.association_name}</h3>
                        {integration.ghl_location_name && (
                          <p className="text-sm text-muted-foreground">
                            GHL: {integration.ghl_location_name}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant={syncStatus === "syncing" ? "default" : "outline"}>
                            {SYNC_STATUS_CONFIG[syncStatus].label}
                          </Badge>
                          {integration.last_sync_at && (
                            <span className="text-xs text-muted-foreground">
                              Last sync: {format(new Date(integration.last_sync_at), "MMM d, HH:mm")}
                            </span>
                          )}
                        </div>
                        {integration.sync_error && (
                          <p className="text-xs text-red-500 mt-1">{integration.sync_error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={integration.status === "connected"}
                        onCheckedChange={(checked) => onToggleIntegration(integration.id, checked)}
                        disabled={isLoading || integration.status === "pending"}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onSyncNow(integration.id)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenSettings(integration)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDisconnectClick(integration)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Disconnect
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={integration.settings.sync_contacts} disabled />
                      <span className="text-muted-foreground">Contacts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={integration.settings.sync_properties} disabled />
                      <span className="text-muted-foreground">Properties</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={integration.settings.sync_maintenance} disabled />
                      <span className="text-muted-foreground">Maintenance</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox checked={integration.settings.sync_payments} disabled />
                      <span className="text-muted-foreground">Payments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
            <DialogDescription>
              Configure sync settings for {selectedIntegration?.association_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_contacts"
                checked={editingSettings.sync_contacts}
                onChange={(e) =>
                  setEditingSettings((prev) => ({ ...prev, sync_contacts: e.target.checked }))
                }
              />
              <Label htmlFor="sync_contacts">Sync Contacts</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_properties"
                checked={editingSettings.sync_properties}
                onChange={(e) =>
                  setEditingSettings((prev) => ({ ...prev, sync_properties: e.target.checked }))
                }
              />
              <Label htmlFor="sync_properties">Sync Properties</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_maintenance"
                checked={editingSettings.sync_maintenance}
                onChange={(e) =>
                  setEditingSettings((prev) => ({ ...prev, sync_maintenance: e.target.checked }))
                }
              />
              <Label htmlFor="sync_maintenance">Sync Maintenance</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sync_payments"
                checked={editingSettings.sync_payments}
                onChange={(e) =>
                  setEditingSettings((prev) => ({ ...prev, sync_payments: e.target.checked }))
                }
              />
              <Label htmlFor="sync_payments">Sync Payments</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Integration</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect the integration for{" "}
              <strong>{selectedIntegration?.association_name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDisconnect}>
              <Unlink className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
