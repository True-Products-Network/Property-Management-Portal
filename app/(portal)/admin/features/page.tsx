"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Shield,
  Target,
  Percent,
} from "lucide-react";
import { useFeatureFlags } from "@/lib/features/feature-hooks";
import { FeatureFlagUserRole } from "@/lib/features/feature-flags";

const AVAILABLE_ROLES: { value: FeatureFlagUserRole; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "owner", label: "Owner" },
  { value: "board", label: "Board Member" },
  { value: "vendor", label: "Vendor" },
];

const ENVIRONMENTS = [
  { value: "all", label: "All Environments" },
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

interface FormData {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  allowedRoles: FeatureFlagUserRole[];
  userPercentage: number;
  associations: string[];
  properties: string[];
  users: string[];
}

export default function AdminFeaturesPage() {
  const { flags, loading, error, fetchFlags, updateFlag, createFlag, deleteFlag } = useFeatureFlags();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [associations, setAssociations] = useState<{ id: string; name: string }[]>([]);
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [formData, setFormData] = useState<FormData>({
    key: "",
    name: "",
    description: "",
    enabled: false,
    environment: "all",
    allowedRoles: ["all"],
    userPercentage: 100,
    associations: [],
    properties: [],
    users: [],
  });

  // Fetch associations and properties for targeting
  useEffect(() => {
    async function fetchData() {
      try {
        const [assocRes, propRes] = await Promise.all([
          fetch("/api/associations"),
          fetch("/api/properties"),
        ]);
        const assocData = await assocRes.json();
        const propData = await propRes.json();
        if (assocData.success) setAssociations(assocData.data || []);
        if (propData.success) setProperties(propData.data || []);
      } catch (error) {
        console.error("Error fetching targeting data:", error);
      }
    }
    fetchData();
  }, []);

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
      allowedRoles: flag.allowed_roles || ["all"],
      userPercentage: flag.user_percentage || 100,
      associations: flag.associations || [],
      properties: flag.properties || [],
      users: flag.users || [],
    });
    setActiveTab("basic");
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
      associations: [],
      properties: [],
      users: [],
    });
    setActiveTab("basic");
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

  const toggleRole = (role: FeatureFlagUserRole) => {
    setFormData((prev) => {
      const currentRoles = prev.allowedRoles;
      if (currentRoles.includes(role)) {
        // Remove role, but ensure at least one remains
        const newRoles = currentRoles.filter((r) => r !== role);
        return { ...prev, allowedRoles: newRoles.length > 0 ? newRoles : ["all"] };
      } else {
        // Add role
        return { ...prev, allowedRoles: [...currentRoles, role] };
      }
    });
  };

  const getRolloutSummary = (flag: any) => {
    const parts: string[] = [];
    
    if (flag.user_percentage < 100) {
      parts.push(`${flag.user_percentage}% of users`);
    }
    
    if (flag.allowed_roles && !flag.allowed_roles.includes("all")) {
      parts.push(`${flag.allowed_roles.length} roles`);
    }
    
    if (flag.associations?.length > 0) {
      parts.push(`${flag.associations.length} associations`);
    }
    
    if (flag.properties?.length > 0) {
      parts.push(`${flag.properties.length} properties`);
    }
    
    if (flag.users?.length > 0) {
      parts.push(`${flag.users.length} specific users`);
    }
    
    return parts.length > 0 ? parts.join(", ") : "All users";
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

  // Common form content for both create and edit dialogs
  const renderFormContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic</TabsTrigger>
        <TabsTrigger value="rollout">Rollout</TabsTrigger>
        <TabsTrigger value="targeting">Targeting</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>

      {/* Basic Tab */}
      <TabsContent value="basic" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="feature.module.name"
              disabled={!!selectedFlag}
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
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Enabled</Label>
            <p className="text-sm text-[var(--secondary-text)]">
              Turn this feature on or off globally
            </p>
          </div>
          <Switch
            id="enabled"
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>
      </TabsContent>

      {/* Rollout Tab */}
      <TabsContent value="rollout" className="space-y-6">
        {/* Percentage Rollout */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-[var(--teal)]" />
            <Label className="text-base font-medium">Percentage Rollout</Label>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-[var(--secondary-text)]">Users affected</span>
              <span className="text-sm font-medium">{formData.userPercentage}%</span>
            </div>
            <Input
              type="range"
              min="0"
              max="100"
              value={formData.userPercentage}
              onChange={(e) => setFormData({ ...formData, userPercentage: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-xs text-[var(--secondary-text)]">
              {formData.userPercentage === 0 && "Feature is disabled for all users"}
              {formData.userPercentage === 100 && "Feature is enabled for all users"}
              {formData.userPercentage > 0 && formData.userPercentage < 100 && 
                `Feature is enabled for ${formData.userPercentage}% of users based on consistent hashing`}
            </p>
          </div>
        </div>

        {/* Role-based */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--teal)]" />
            <Label className="text-base font-medium">Role-based Access</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.value}`}
                  checked={formData.allowedRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                />
                <Label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Targeting Tab */}
      <TabsContent value="targeting" className="space-y-6">
        {/* Association Targeting */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--teal)]" />
            <Label className="text-base font-medium">Association Targeting</Label>
          </div>
          <p className="text-sm text-[var(--secondary-text)]">
            Limit this feature to specific associations (HOAs). Leave empty for all.
          </p>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {associations.length === 0 ? (
              <p className="text-sm text-[var(--secondary-text)]">No associations found</p>
            ) : (
              <div className="space-y-2">
                {associations.map((assoc) => (
                  <div key={assoc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`assoc-${assoc.id}`}
                      checked={formData.associations.includes(assoc.id)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          associations: checked
                            ? [...prev.associations, assoc.id]
                            : prev.associations.filter((id) => id !== assoc.id),
                        }));
                      }}
                    />
                    <Label htmlFor={`assoc-${assoc.id}`} className="text-sm cursor-pointer">
                      {assoc.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          {formData.associations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, associations: [] }))}
            >
              Clear Associations
            </Button>
          )}
        </div>

        {/* Property Targeting */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--teal)]" />
            <Label className="text-base font-medium">Property Targeting</Label>
          </div>
          <p className="text-sm text-[var(--secondary-text)]">
            Limit this feature to specific properties. Leave empty for all.
          </p>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {properties.length === 0 ? (
              <p className="text-sm text-[var(--secondary-text)]">No properties found</p>
            ) : (
              <div className="space-y-2">
                {properties.map((prop) => (
                  <div key={prop.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`prop-${prop.id}`}
                      checked={formData.properties.includes(prop.id)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          properties: checked
                            ? [...prev.properties, prop.id]
                            : prev.properties.filter((id) => id !== prop.id),
                        }));
                      }}
                    />
                    <Label htmlFor={`prop-${prop.id}`} className="text-sm cursor-pointer">
                      {prop.name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
          {formData.properties.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData((prev) => ({ ...prev, properties: [] }))}
            >
              Clear Properties
            </Button>
          )}
        </div>
      </TabsContent>

      {/* Advanced Tab */}
      <TabsContent value="advanced" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="environment">Environment</Label>
          <Select
            value={formData.environment}
            onValueChange={(value) => setFormData({ ...formData, environment: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((env) => (
                <SelectItem key={env.value} value={env.value}>
                  {env.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-[var(--secondary-text)]">
            Limit this feature to specific environments
          </p>
        </div>

        {/* User IDs */}
        <div className="space-y-2">
          <Label>Specific User IDs</Label>
          <p className="text-sm text-[var(--secondary-text)]">
            Enter user IDs (one per line) to enable for specific users only
          </p>
          <textarea
            className="w-full min-h-[100px] p-3 border rounded-md text-sm font-mono"
            placeholder="user-id-1&#10;user-id-2&#10;user-id-3"
            value={formData.users.join("\n")}
            onChange={(e) => {
              const ids = e.target.value
                .split("\n")
                .map((id) => id.trim())
                .filter((id) => id.length > 0);
              setFormData((prev) => ({ ...prev, users: ids }));
            }}
          />
          {formData.users.length > 0 && (
            <p className="text-xs text-[var(--secondary-text)]">
              {formData.users.length} user(s) specified
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );

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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Feature Flag</DialogTitle>
                <DialogDescription>
                  Add a new feature toggle with advanced rollout options
                </DialogDescription>
              </DialogHeader>
              {renderFormContent()}
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
                <TableHead>Rollout Strategy</TableHead>
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
                      <div className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-[var(--secondary-text)]" />
                          <span>{getRolloutSummary(flag)}</span>
                        </div>
                        {flag.user_percentage < 100 && (
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-[var(--teal)] rounded-full"
                              style={{ width: `${flag.user_percentage}%` }}
                            />
                          </div>
                        )}
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
                          <DropdownMenuItem onClick={() => handleToggle(flag)}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Feature Flag</DialogTitle>
            <DialogDescription>Update feature flag settings and rollout strategy</DialogDescription>
          </DialogHeader>
          {renderFormContent()}
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
