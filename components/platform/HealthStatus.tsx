"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cloud,
  Shield,
  Clock,
  Activity,
} from "lucide-react";

export interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down" | "maintenance";
  latency_ms: number;
  last_checked: string;
  message?: string;
}

export interface SystemIncident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "major" | "minor" | "info";
  status: "investigating" | "identified" | "monitoring" | "resolved";
  started_at: string;
  resolved_at?: string;
  affected_services: string[];
}

export interface HealthStatusData {
  overall_status: "healthy" | "degraded" | "down";
  services: ServiceStatus[];
  incidents: SystemIncident[];
  last_updated: string;
}

interface HealthStatusProps {
  data?: HealthStatusData;
  onRefresh?: () => void;
  isLoading?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const STATUS_CONFIG = {
  healthy: {
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    icon: CheckCircle,
    label: "Healthy",
  },
  degraded: {
    color: "bg-yellow-500",
    textColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    icon: AlertTriangle,
    label: "Degraded",
  },
  down: {
    color: "bg-red-500",
    textColor: "text-red-600",
    bgColor: "bg-red-50",
    icon: XCircle,
    label: "Down",
  },
  maintenance: {
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    icon: Clock,
    label: "Maintenance",
  },
};

const SEVERITY_CONFIG = {
  critical: { color: "bg-red-500", label: "Critical" },
  major: { color: "bg-orange-500", label: "Major" },
  minor: { color: "bg-yellow-500", label: "Minor" },
  info: { color: "bg-blue-500", label: "Info" },
};

const INCIDENT_STATUS_CONFIG = {
  investigating: { variant: "destructive" as const, label: "Investigating" },
  identified: { variant: "secondary" as const, label: "Identified" },
  monitoring: { variant: "default" as const, label: "Monitoring" },
  resolved: { variant: "outline" as const, label: "Resolved" },
};

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  api: Server,
  database: Database,
  storage: Cloud,
  auth: Shield,
  default: Activity,
};

export function HealthStatus({
  data,
  onRefresh,
  isLoading = false,
  autoRefresh = false,
  refreshInterval = 30000,
}: HealthStatusProps) {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      onRefresh?.();
      setLastRefresh(new Date());
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const overallConfig = data ? STATUS_CONFIG[data.overall_status] : STATUS_CONFIG.healthy;
  const OverallIcon = overallConfig.icon;

  const getServiceIcon = (serviceName: string) => {
    const key = Object.keys(SERVICE_ICONS).find((k) =>
      serviceName.toLowerCase().includes(k)
    );
    return SERVICE_ICONS[key || "default"];
  };

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className={overallConfig.bgColor}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${overallConfig.color} text-white`}>
                <OverallIcon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{overallConfig.label}</h2>
                <p className="text-muted-foreground">
                  Last updated: {format(lastRefresh, "MMM d, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.services.map((service) => {
            const config = STATUS_CONFIG[service.status];
            const ServiceIcon = getServiceIcon(service.name);
            return (
              <Card key={service.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <ServiceIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {service.latency_ms}ms latency
                        </p>
                      </div>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  </div>
                  {service.message && (
                    <p className="mt-2 text-sm text-muted-foreground">{service.message}</p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Checked: {format(new Date(service.last_checked), "HH:mm:ss")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Incidents */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Incidents</h3>
        {data?.incidents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No incidents in the last 30 days</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data?.incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <CardDescription>
                        Started: {format(new Date(incident.started_at), "MMM d, yyyy HH:mm")}
                        {incident.resolved_at &&
                          ` • Resolved: ${format(new Date(incident.resolved_at), "MMM d, yyyy HH:mm")}`}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={INCIDENT_STATUS_CONFIG[incident.status].variant}>
                        {INCIDENT_STATUS_CONFIG[incident.status].label}
                      </Badge>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${
                          SEVERITY_CONFIG[incident.severity].color
                        }`}
                      >
                        {SEVERITY_CONFIG[incident.severity].label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {incident.affected_services.map((service) => (
                      <Badge key={service} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
