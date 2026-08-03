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
  ghlWorkflowName: string;
  ghlWorkflowId: string;
  trigger: string;
  active: boolean;
  messageTemplate: string;
  reminderTiming: string;
  escalationOwner: string;
  lastTest: string | null;
  lastSuccessfulRun: string | null;
  runCount: number;
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
      const response = await fetch("/api/admin/workflows");
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setWorkflows(result.data);
        } else {
          setWorkflows(getDefaultWorkflows());
        }
      } else {
        console.warn("API returned error, using defaults");
        setWorkflows(getDefaultWorkflows());
      }
    } catch (error) {
      console.error("Error loading workflows:", error);
      setWorkflows(getDefaultWorkflows());
    } finally {
      setIsLoading(false);
    }
  }

  function getDefaultWorkflows(): Workflow[] {
    return [
      {
        id: "1",
        code: "MAINT_NEW",
        ghlWorkflowName: "New Maintenance Request",
        ghlWorkflowId: "wf_123456",
        trigger: "record_created",
        active: true,
        messageTemplate: "A new maintenance request has been submitted for {{property_name}}.",
        reminderTiming: "24_hours",
        escalationOwner: "Property Manager",
        lastTest: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastSuccessfulRun: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        runCount: 156,
        description: "Triggered when a new maintenance request is created",
      },
      {
        id: "2",
        code: "MAINT_ESCALATE",
        ghlWorkflowName: "Maintenance Escalation",
        ghlWorkflowId: "wf_123457",
        trigger: "status_changed",
        active: true,
        messageTemplate: "Maintenance request {{request_number}} requires escalation.",
        reminderTiming: "1_hour",
        escalationOwner: "Admin User",
        lastTest: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastSuccessfulRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        runCount: 23,
        description: "Triggered when maintenance request is escalated",
      },
      {
        id: "3",
        code: "INSP_SCHEDULED",
        ghlWorkflowName: "Inspection Scheduled",
        ghlWorkflowId: "wf_123458",
        trigger: "scheduled_date",
        active: true,
        messageTemplate: "Inspection scheduled for {{unit_number}} on {{inspection_date}}.",
        reminderTiming: "24_hours",
        escalationOwner: "Inspector",
        lastTest: null,
        lastSuccessfulRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        runCount: 89,
        description: "Triggered when inspection is scheduled",
      },
      {
        id: "4",
        code: "APPROVAL_REQ",
        ghlWorkflowName: "Approval Requested",
        ghlWorkflowId: "wf_123459",
        trigger: "approval_requested",
        active: true,
        messageTemplate: "Your approval is requested for {{approval_type}} - ${{amount}}.",
        reminderTiming: "3_days",
        escalationOwner: "Board Approver",
        lastTest: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastSuccessfulRun: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        runCount: 45,
        description: "Triggered when approval is requested",
      },
      {
        id: "5",
        code: "PAYMENT_REC",
        ghlWorkflowName: "Payment Received",
        ghlWorkflowId: "wf_123460",
        trigger: "payment_received",
        active: true,
        messageTemplate: "Payment of ${{amount}} received from {{contact_name}}.",
        reminderTiming: "none",
        escalationOwner: "Bookkeeper",
        lastTest: null,
        lastSuccessfulRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        runCount: 234,
        description: "Triggered when payment is received",
      },
      {
        id: "6",
        code: "COMPLIANCE_ALERT",
        ghlWorkflowName: "Compliance Alert",
        ghlWorkflowId: "wf_123461",
        trigger: "scheduled_date",
        active: false,
        messageTemplate: "Compliance matter {{compliance_title}} requires attention.",
        reminderTiming: "7_days",
        escalationOwner: "Property Manager",
        lastTest: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        lastSuccessfulRun: null,
        runCount: 0,
        description: "Triggered for compliance due dates",
      },
    ];
  }

  function handleEdit(workflow: Workflow) {
    setEditingWorkflow(workflow);
    setFormData({
      code: workflow.code,
      ghlWorkflowName: workflow.ghlWorkflowName,
      ghlWorkflowId: workflow.ghlWorkflowId,
      trigger: workflow.trigger,
      active: workflow.active,
      messageTemplate: workflow.messageTemplate,
      reminderTiming: workflow.reminderTiming,
      escalationOwner: workflow.escalationOwner,
      description: workflow.description,
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
      const payload = { ...formData };
      const url = editingWorkflow ? `/api/admin/workflows/${editingWorkflow.id}` : "/api/admin/workflows";
      const method = editingWorkflow ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.ghlWorkflowName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = workflows.filter((w) => w.active).length;
  const totalRuns = workflows.reduce((sum, w) => sum + w.runCount, 0);

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
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        {filteredWorkflows.map((workflow) => (
          <Card key={workflow.id} className={workflow.active ? "" : "opacity-60"}>
            <CardContent className="p-0">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--page-background)]"
                onClick={() => toggleExpand(workflow.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[var(--teal)]/10 flex items-center justify-center">
                    <Workflow className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[var(--main-text)]">{workflow.ghlWorkflowName}</p>
                      <Badge variant="outline">{workflow.code}</Badge>
                      {workflow.active ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[var(--secondary-text)]">{workflow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <p className="text-[var(--secondary-text)]">Trigger</p>
                    <p className="font-medium">{TRIGGERS.find((t) => t.value === workflow.trigger)?.label || workflow.trigger}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-[var(--secondary-text)]">Runs</p>
                    <p className="font-medium">{workflow.runCount.toLocaleString()}</p>
                  </div>
                  {expandedWorkflow === workflow.id ? (
                    <ChevronUp className="h-5 w-5 text-[var(--secondary-text)]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                  )}
                </div>
              </div>

              {expandedWorkflow === workflow.id && (
                <div className="border-t border-[var(--border-color)] p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[var(--secondary-text)]">GHL Workflow ID</p>
                      <p className="text-sm font-medium">{workflow.ghlWorkflowId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--secondary-text)]">Escalation Owner</p>
                      <p className="text-sm font-medium">{workflow.escalationOwner}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--secondary-text)]">Reminder Timing</p>
                      <p className="text-sm font-medium">
                        {REMINDER_TIMINGS.find((t) => t.value === workflow.reminderTiming)?.label || workflow.reminderTiming}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--secondary-text)]">Last Test</p>
                      <p className="text-sm font-medium">
                        {workflow.lastTest ? new Date(workflow.lastTest).toLocaleDateString() : "Never"}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-[var(--secondary-text)] mb-1">Message Template</p>
                    <p className="text-sm bg-[var(--page-background)] p-2 rounded">{workflow.messageTemplate}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {workflow.lastSuccessfulRun ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Last run: {new Date(workflow.lastSuccessfulRun).toLocaleString()}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500">
                          <XCircle className="h-4 w-4" />
                          No successful runs
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
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
                      <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workflow Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[var(--border-color)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
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
                  <label className="block text-sm font-medium mb-2">GHL Workflow Name *</label>
                  <Input
                    value={formData.ghlWorkflowName}
                    onChange={(e) => setFormData({ ...formData, ghlWorkflowName: e.target.value })}
                    placeholder="e.g., New Maintenance Request"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">GHL Workflow ID *</label>
                  <Input
                    value={formData.ghlWorkflowId}
                    onChange={(e) => setFormData({ ...formData, ghlWorkflowId: e.target.value })}
                    placeholder="e.g., wf_123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Trigger *</label>
                  <select
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select trigger</option>
                    {TRIGGERS.map((t) => (
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
                  className="input w-full h-20"
                />
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  Use {"{{variable_name}}"} for dynamic content
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Timing</label>
                  <select
                    value={formData.reminderTiming}
                    onChange={(e) => setFormData({ ...formData, reminderTiming: e.target.value })}
                    className="input w-full"
                  >
                    {REMINDER_TIMINGS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Escalation Owner</label>
                  <Input
                    value={formData.escalationOwner}
                    onChange={(e) => setFormData({ ...formData, escalationOwner: e.target.value })}
                    placeholder="e.g., Property Manager"
                  />
                </div>
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
