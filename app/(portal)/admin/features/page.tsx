"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Edit3,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Flag,
  Users,
  Building2,
  Settings,
} from "lucide-react";
import { useFeatureFlags, FeatureGate } from "@/lib/features/feature-hooks";
import { FEATURE_FLAGS } from "@/lib/features/feature-flags";

export default function AdminFeaturesPage() {
  const { flags, loading, error, fetchFlags, updateFlag, createFlag, deleteFlag } = useFeatureFlags();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    enabled: false,
    environment: "all",
    allowedRoles: ["all"],
    userPercentage: 100,
  });

  const filteredFlags = flags.filter(
    (flag) =>
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    setIsSubmitting(true);
    const result = await createFlag(formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsCreateDialogOpen(false);
      resetForm();
    } else {
      alert(result.error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlag) return;

    setIsSubmitting(true);
    const result = await updateFlag(selectedFlag.id, formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsEditDialogOpen(false);
      setSelectedFlag(null);
      resetForm();
    } else {
      alert(result.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;

    const result = await deleteFlag(id);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleToggle = async (flag: any) => {
    const result = await updateFlag(flag.id, { enabled: !flag.enabled });
    if (!result.success) {
      alert(result.error);
    }
  };

  const openEditDialog = (flag: any) => {
    setSelectedFlag(flag);
    setFormData({
      key: flag.key,
      name: flag.name,
      description: flag.description || "",
      enabled: flag.enabled,
      environment: flag.environment,
      allowedRoles: flag.allowed_roles,
      userPercentage: flag.user_percentage,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      key: "",
      name: "",
      description: "",
      enabled: false,
      environment: "all",
      allowedRoles: ["all"],
      userPercentage: 100,
    });
  };

  const initializeDefaults = async () => {
    try {
      const response = await fetch("/api/admin/features", {
        method: "PUT",
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        fetchFlags();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Failed to initialize default flags");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchFlags} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Feature Flags</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage feature toggles and gradual rollouts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={initializeDefaults} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Initialize Defaults
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <Plus className="h-4 w-4 mr-2" />
                New Feature Flag
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature toggle to control feature availability
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="key">Key</Label>
                    <Input
                      id="key"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      placeholder="feature.module.name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Feature Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this feature do?"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled">Enabled</Label>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={isSubmitting} className="bg-[var(--teal)]">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search feature flags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Rollout</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFlags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Flag className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
                    <p className="text-[var(--secondary-text)]">No feature flags found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredFlags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{flag.name}</p>
                        <p className="text-sm text-[var(--secondary-text)]">{flag.key}</p>
                        {flag.description && (
                          <p className="text-xs text-[var(--secondary-text)] mt-1">
                            {flag.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(flag)}
                        className="flex items-center gap-2"
                      >
                        {flag.enabled ? (
                          <>
                            <ToggleRight className="h-6 w-6 text-green-500" />
                            <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-6 w-6 text-gray-400" />
                            <Badge className="bg-gray-100 text-gray-700">Disabled</Badge>
                          </>
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{flag.environment}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--secondary-text)]" />
                        <span>{flag.user_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(flag)}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggle(flag)}
                          >
                            {flag.enabled ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />
                                Enable
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(flag.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>Update feature flag settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-key">Key</Label>
                <Input id="edit-key" value={formData.key} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-enabled">Enabled</Label>
              <Switch
                id="edit-enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-percentage">User Percentage ({formData.userPercentage}%)</Label>
              <Input
                id="edit-percentage"
                type="range"
                min="0"
                max="100"
                value={formData.userPercentage}
                onChange={(e) => setFormData({ ...formData, userPercentage: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-[var(--teal)]">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
