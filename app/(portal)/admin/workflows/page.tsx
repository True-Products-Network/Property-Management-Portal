"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft, Construction, Clock, Settings, Workflow, Zap } from "lucide-react";

export default function AdminWorkflowsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
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

      {/* Under Construction */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 pb-6 text-center">
          <Construction className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            Workflow Settings - Under Construction
          </h2>
          <p className="text-amber-700 mb-4 max-w-md mx-auto">
            This feature is currently being developed. You will be able to configure 
            workflow triggers, templates, and automation rules here soon.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600">
            <Clock className="h-4 w-4" />
            <span>Expected completion: Coming soon</span>
          </div>
        </CardContent>
      </Card>

      {/* Planned Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-[var(--teal)]" />
            Planned Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-3 w-3 text-[var(--teal)]" />
              </div>
              <div>
                <p className="font-medium">Workflow Triggers</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  Configure event-based triggers (new request, status change, scheduled date)
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Settings className="h-3 w-3 text-[var(--teal)]" />
              </div>
              <div>
                <p className="font-medium">GHL Workflow Integration</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  Map portal actions to GHL workflow triggers and templates
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--teal)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Activity className="h-3 w-3 text-[var(--teal)]" />
              </div>
              <div>
                <p className="font-medium">Automation Rules</p>
                <p className="text-sm text-[var(--secondary-text)]">
                  Create conditional rules for automatic assignments and notifications
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
