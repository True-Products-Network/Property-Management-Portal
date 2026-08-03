"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Workflow,
  Plus,
  Search,
  Edit2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Bell,
  UserCog,
  Zap,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Workflow {
  id: string;
  code: string;
  ghl_workflow_name: string;
  ghl_workflow_id: string;
  trigger: string;
  active: boolean;
  message_template: string;
  reminder_timing: string;
  escalation_owner: string;
  last_test: string | null;
  last_successful_run: string | null;
  run_count: number;
  description: string;
}

interface FormData {
  code: string;
  ghlWorkflowName: string;
  ghlWorkflowId: string;
  trigger: string;
  active: boolean;
  messageTemplate: string;
  reminderTiming: string;
  escalationOwner: string;
  description: string;
}

const TRIGGERS = [
  { value: "record_created", label: "Record Created" },
  { value: "status_changed", label: "Status Changed" },
  { value: "scheduled_date", label: "Scheduled Date" },
  { value: "approval_requested", label: "Approval Requested" },
  { value: "payment_received", label: "Payment Received" },
  { value: "manual", label: "Manual Trigger" },
];

const REMINDER_TIMINGS = [
  { value: "none", label: "No Reminder" },
  { value: "1_hour", label: "1 Hour Before" },
  { value: "24_hours", label: "24 Hours Before" },
  { value: "3_days", label: "3 Days Before" },
  { value: "7_days", label: "7 Days Before" },
];

export default function WorkflowSettingsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: "",
    ghlWorkflowName: "",
    ghlWorkflowId: "",
    trigger: "",
    active: true,
    messageTemplate: "",
    reminderTiming: "none",
    escalationOwner: "",
    description: "",
  });

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function loadWorkflows() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/workflows");
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setWorkflows(result.data);
        } else {
          setWorkflows([]);
        }
      } else {
        setWorkflows([]);
      }
    } catch (error) {
      console.error("Error loading workflows:", error);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(workflow: Workflow) {
    setEditingWorkflow(workflow);
    setFormData({
      code: workflow.code,
      ghlWorkflowName: workflow.ghl_workflow_name,
      ghlWorkflowId: workflow.ghl_workflow_id,
      trigger: workflow.trigger,
      active: workflow.active,
      messageTemplate: workflow.message_template || "",
      reminderTiming: workflow.reminder_timing || "none",
      escalationOwner: workflow.escalation_owner || "",
      description: workflow.description || "",
    });
    setShowModal(true);
  }

  function handleCreate() {
    setEditingWorkflow(null);
    setFormData({
      code: "",
      ghlWorkflowName: "",
      ghlWorkflowId: "",
      trigger: "",
      active: true,
      messageTemplate: "",
      reminderTiming: "none",
      escalationOwner: "",
      description: "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.code.trim() || !formData.ghlWorkflowName.trim()) {
      alert("Workflow code and GHL workflow name are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingWorkflow
        ? `/api/admin/workflows/${editingWorkflow.id}`
        : "/api/admin/workflows";
      const method = editingWorkflow ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        loadWorkflows();
        alert(editingWorkflow ? "Workflow updated successfully" : "Workflow created successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save workflow");
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("An error occurred while saving the workflow");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest(workflowId: string) {
    setIsTesting(workflowId);
    try {
      const response = await fetch(`/api/admin/workflows/${workflowId}/test`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Workflow test initiated successfully");
        loadWorkflows();
      } else {
        alert("Failed to test workflow");
      }
    } catch (error) {
      console.error("Error testing workflow:", error);
      alert("An error occurred while testing the workflow");
    } finally {
      setIsTesting(null);
    }
  }

  function toggleExpand(workflowId: string) {
    setExpandedWorkflow(expandedWorkflow === workflowId ? null : workflowId);
  }

  const filteredWorkflows = workflows.filter(
    (w) =>
      w.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.ghl_workflow_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = workflows.filter((w) => w.active).length;
  const totalRuns = workflows.reduce((sum, w) => sum + (w.run_count || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Workflow Settings</h1>
            <p className="text-[var(--secondary-text)] mt-1">Configure workflow triggers and templates</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Workflows</p>
            <p className="text-2xl font-semibold">{workflows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Active</p>
            <p className="text-2xl font-semibold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Inactive</p>
            <p className="text-2xl font-semibold text-gray-500">{workflows.length - activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Runs</p>
            <p className="text-2xl font-semibold">{totalRuns.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Workflow className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No workflows found</p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className={workflow.active ? "" : "opacity-60"}>
              <CardContent className="p-0">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--page-background)]"
                  onClick={() => toggleExpand(workflow.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--page-background)] flex items-center justify-center">
                      <Zap className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{workflow.ghl_workflow_name}</h3>
                        <Badge variant="outline">{workflow.code}</Badge>
                        {workflow.active ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)] mt-1">
                        {workflow.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-[var(--secondary-text)]">Runs</p>
                      <p className="font-semibold">{(workflow.run_count || 0).toLocaleString()}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(workflow.id);
                      }}
                    >
                      {expandedWorkflow === workflow.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {expandedWorkflow === workflow.id && (
                  <div className="border-t border-[var(--border-color)] p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Trigger</p>
                        <p className="font-medium">{workflow.trigger}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">GHL Workflow ID</p>
                        <p className="font-medium">{workflow.ghl_workflow_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Reminder Timing</p>
                        <p className="font-medium">{workflow.reminder_timing || "None"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Escalation Owner</p>
                        <p className="font-medium">{workflow.escalation_owner || "None"}</p>
                      </div>
                    </div>

                    {workflow.message_template && (
                      <div className="mb-4">
                        <p className="text-sm text-[var(--secondary-text)]">Message Template</p>
                        <p className="text-sm bg-[var(--page-background)] p-2 rounded mt-1">
                          {workflow.message_template}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEdit(workflow)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(workflow.id)}
                        disabled={isTesting === workflow.id}
                      >
                        {isTesting === workflow.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Test
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingWorkflow ? "Edit Workflow" : "Add Workflow"}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Code *</label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., MAINT_NEW"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">GHL Workflow ID</label>
                  <Input
                    value={formData.ghlWorkflowId}
                    onChange={(e) => setFormData({ ...formData, ghlWorkflowId: e.target.value })}
                    placeholder="e.g., wf_123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">GHL Workflow Name *</label>
                <Input
                  value={formData.ghlWorkflowName}
                  onChange={(e) => setFormData({ ...formData, ghlWorkflowName: e.target.value })}
                  placeholder="e.g., New Maintenance Request"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Trigger</label>
                  <select
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    <option value="">Select trigger</option>
                    {TRIGGERS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Timing</label>
                  <select
                    value={formData.reminderTiming}
                    onChange={(e) => setFormData({ ...formData, reminderTiming: e.target.value })}
                    className="w-full border rounded-md px-3 py-2"
                  >
                    {REMINDER_TIMINGS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this workflow is triggered"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message Template</label>
                <textarea
                  value={formData.messageTemplate}
                  onChange={(e) => setFormData({ ...formData, messageTemplate: e.target.value })}
                  placeholder="Enter message template with variables like {{property_name}}"
                  className="w-full border rounded-md px-3 py-2 h-20"
                />
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  Use {"{{variable_name}}"} for dynamic content
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Escalation Owner</label>
                <Input
                  value={formData.escalationOwner}
                  onChange={(e) => setFormData({ ...formData, escalationOwner: e.target.value })}
                  placeholder="e.g., Property Manager"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">Active</label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingWorkflow ? "Save Changes" : "Create Workflow"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
