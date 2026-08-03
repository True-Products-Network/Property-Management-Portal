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
  AlertTriangle,
} from "lucide-react";

const AVAILABLE_ROLES = [
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

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  allowed_roles: string[];
  user_percentage: number;
  associations: string[];
  properties: string[];
  users: string[];
}

interface FormData {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: string;
  allowedRoles: string[];
  userPercentage: number;
  associations: string[];
  properties: string[];
  users: string[];
}

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
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

  // Fetch feature flags
  const fetchFlags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch("/api/platform/features", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        // Normalize data to ensure all fields exist
        const normalizedFlags = result.data.map((flag: any) => ({
          ...flag,
          allowed_roles: Array.isArray(flag.allowed_roles) ? flag.allowed_roles : ["all"],
          user_percentage: typeof flag.user_percentage === 'number' ? flag.user_percentage : 100,
          associations: Array.isArray(flag.associations) ? flag.associations : [],
          properties: Array.isArray(flag.properties) ? flag.properties : [],
          users: Array.isArray(flag.users) ? flag.users : [],
        }));
        setFlags(normalizedFlags);
      } else {
        setFlags([]);
        setError(result.error || "Failed to load feature flags");
      }
    } catch (err) {
      setFlags([]);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch associations and properties for targeting
  useEffect(() => {
    fetchFlags();
    
    async function fetchData() {
      try {
        const [assocRes, propRes] = await Promise.all([
          fetch("/api/associations"),
          fetch("/api/properties"),
        ]);
        
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociations(assocData.data || []);
        }
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData.success) setProperties(propData.data || []);
        }
      } catch (error) {
        console.error("Error fetching targeting data:", error);
      }
    }
    fetchData();
  }, []);

  const filteredFlags = flags.filter(
    (flag) =>
      flag.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/platform/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        setIsCreateDialogOpen(false);
        resetForm();
        fetchFlags();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to create feature flag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlag) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/platform/features/${selectedFlag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (result.success) {
        setIsEditDialogOpen(false);
        setSelectedFlag(null);
        resetForm();
        fetchFlags();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to update feature flag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feature flag?")) return;

    try {
      const response = await fetch(`/api/platform/features/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        fetchFlags();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to delete feature flag");
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`/api/platform/features/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      const result = await response.json();

      if (result.success) {
        fetchFlags();
      } else {
        alert(result.error);
      }
    } catch (err) {
      alert("Failed to toggle feature flag");
    }
  };

  const openEditDialog = (flag: FeatureFlag) => {
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
      const response = await fetch("/api/platform/features", {
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

  const toggleRole = (role: string) => {
    setFormData((prev) => {
      const currentRoles = Array.isArray(prev.allowedRoles) ? prev.allowedRoles : ["all"];
      if (currentRoles.includes(role)) {
        const newRoles = currentRoles.filter((r) => r !== role);
        return { ...prev, allowedRoles: newRoles.length > 0 ? newRoles : ["all"] };
      } else {
        return { ...prev, allowedRoles: [...currentRoles, role] };
      }
    });
  };

  const getRolloutSummary = (flag: FeatureFlag) => {
    if (!flag) return "All users";
    
    const parts: string[] = [];
    
    const userPercentage = typeof flag.user_percentage === 'number' ? flag.user_percentage : 100;
    if (userPercentage < 100) {
      parts.push(`${userPercentage}% of users`);
    }
    
    const allowedRoles = Array.isArray(flag.allowed_roles) ? flag.allowed_roles : ["all"];
    if (!allowedRoles.includes("all")) {
      parts.push(`${allowedRoles.length} roles`);
    }
    
    const associations = Array.isArray(flag.associations) ? flag.associations : [];
    if (associations.length > 0) {
      parts.push(`${associations.length} associations`);
    }
    
    const properties = Array.isArray(flag.properties) ? flag.properties : [];
    if (properties.length > 0) {
      parts.push(`${properties.length} properties`);
    }
    
    const users = Array.isArray(flag.users) ? flag.users : [];
    if (users.length > 0) {
      parts.push(`${users.length} specific users`);
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
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchFlags} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
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
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--teal)]" />
            <Label className="text-base font-medium">Role-based Access</Label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.value}`}
                  checked={Array.isArray(formData.allowedRoles) && formData.allowedRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                />
                <Label htmlFor={`role-${role.value}`} className="text-sm">
                  {role.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Targeting Tab */}
      <TabsContent value="targeting" className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--teal)]" />
            <Label>Association Targeting</Label>
          </div>
          <Select
            value={Array.isArray(formData.associations) && formData.associations.length > 0 ? formData.associations[0] : "all"}
            onValueChange={(value) =>
              setFormData({ ...formData, associations: value === "all" ? [] : [value] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select associations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Associations</SelectItem>
              {Array.isArray(associations) && associations.map((assoc) => (
                <SelectItem key={assoc.id} value={assoc.id}>
                  {assoc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--teal)]" />
            <Label>Property Targeting</Label>
          </div>
          <Select
            value={Array.isArray(formData.properties) && formData.properties.length > 0 ? formData.properties[0] : "all"}
            onValueChange={(value) =>
              setFormData({ ...formData, properties: value === "all" ? [] : [value] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select properties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Properties</SelectItem>
              {Array.isArray(properties) && properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      {/* Advanced Tab */}
      <TabsContent value="advanced" className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[var(--teal)]" />
            <Label>Environment</Label>
          </div>
          <Select
            value={formData.environment}
            onValueChange={(value) => setFormData({ ...formData, environment: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ENVIRONMENTS.map((env) => (
                <SelectItem key={env.value} value={env.value}>
                  {env.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                    {flags.length === 0 && (
                      <Button onClick={initializeDefaults} variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Initialize Default Flags
                      </Button>
                    )}
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
                        {(typeof flag.user_percentage === 'number' ? flag.user_percentage : 100) < 100 && (
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-[var(--teal)] rounded-full"
                              style={{ width: `${typeof flag.user_percentage === 'number' ? flag.user_percentage : 100}%` }}
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
