"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Home,
  Users,
  Wrench,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  Calendar,
  ArrowLeft,
  FileText,
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  code: string;
  associationCount: number;
  propertyCount: number;
  unitCount: number;
  occupancyRate: number;
  openMaintenanceCount: number;
  urgentItemsCount: number;
  monthlyRevenue: number;
  status: "active" | "inactive" | "at_risk";
  lastActivity: string;
}

interface PortfolioStats {
  totalBusinesses: number;
  totalAssociations: number;
  totalProperties: number;
  totalUnits: number;
  overallOccupancyRate: number;
  totalOpenMaintenance: number;
  totalUrgentItems: number;
  portfolioValue: number;
}

interface PortfolioAlert {
  id: string;
  type: "maintenance" | "compliance" | "financial" | "occupancy";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  businessId: string;
  businessName: string;
  createdAt: string;
}

export default function PortfolioPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [alerts, setAlerts] = useState<PortfolioAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  async function loadPortfolioData() {
    try {
      setIsLoading(true);
      setError(null);

      // Load all businesses for this tenant
      const businessesResponse = await fetch("/api/businesses");
      const businessesResult = await businessesResponse.json();
      
      if (businessesResult.success) {
        // Enrich business data with metrics
        const enrichedBusinesses = await Promise.all(
          businessesResult.data.map(async (business: any) => {
            // Get associations count
            const assocResponse = await fetch(`/api/associations?businessId=${business.id}&limit=1`);
            const assocResult = await assocResponse.json();
            
            // Get properties count
            const propResponse = await fetch(`/api/properties?businessId=${business.id}&limit=1`);
            const propResult = await propResponse.json();
            
            // Get units count
            const unitsResponse = await fetch(`/api/units?businessId=${business.id}&limit=1`);
            const unitsResult = await unitsResponse.json();
            
            // Get open maintenance
            const maintResponse = await fetch(`/api/maintenance?businessId=${business.id}&status=new,in_progress&limit=1`);
            const maintResult = await maintResponse.json();
            
            // Calculate occupancy rate (simplified)
            const totalUnits = unitsResult.data?.total || 0;
            const occupiedUnits = totalUnits; // Would need actual occupancy data
            const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
            
            return {
              id: business.id,
              name: business.name,
              code: business.code,
              associationCount: assocResult.data?.total || 0,
              propertyCount: propResult.data?.total || 0,
              unitCount: totalUnits,
              occupancyRate,
              openMaintenanceCount: maintResult.data?.total || 0,
              urgentItemsCount: 0, // Would need to calculate
              monthlyRevenue: 0, // Would need financial data
              status: "active" as const,
              lastActivity: business.updated_at || business.created_at,
            };
          })
        );
        
        setBusinesses(enrichedBusinesses);
        
        // Calculate portfolio stats
        const totalStats = enrichedBusinesses.reduce(
          (acc, business) => ({
            totalBusinesses: acc.totalBusinesses + 1,
            totalAssociations: acc.totalAssociations + business.associationCount,
            totalProperties: acc.totalProperties + business.propertyCount,
            totalUnits: acc.totalUnits + business.unitCount,
            totalOpenMaintenance: acc.totalOpenMaintenance + business.openMaintenanceCount,
            totalUrgentItems: acc.totalUrgentItems + business.urgentItemsCount,
          }),
          {
            totalBusinesses: 0,
            totalAssociations: 0,
            totalProperties: 0,
            totalUnits: 0,
            totalOpenMaintenance: 0,
            totalUrgentItems: 0,
          }
        );
        
        const overallOccupancy = totalStats.totalUnits > 0
          ? Math.round(
              enrichedBusinesses.reduce((sum, b) => sum + b.occupancyRate, 0) /
                enrichedBusinesses.length
            )
          : 0;
        
        setStats({
          ...totalStats,
          overallOccupancyRate: overallOccupancy,
          portfolioValue: enrichedBusinesses.reduce((sum, b) => sum + b.monthlyRevenue, 0),
        });
      }

      // Load portfolio alerts
      await loadAlerts();
    } catch (error) {
      console.error("Error loading portfolio:", error);
      setError(error instanceof Error ? error.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAlerts() {
    // This would come from an alerts API
    // For now, using mock data structure
    setAlerts([]);
  }

  const getStatusBadge = (status: Business["status"]) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "at_risk":
        return <Badge className="bg-red-100 text-red-700">At Risk</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
    }
  };

  const getAlertIcon = (type: PortfolioAlert["type"]) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "compliance":
        return <AlertCircle className="h-4 w-4" />;
      case "financial":
        return <DollarSign className="h-4 w-4" />;
      case "occupancy":
        return <Users className="h-4 w-4" />;
    }
  };

  const getAlertColor = (severity: PortfolioAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-amber-600 bg-amber-50";
      case "low":
        return "text-blue-600 bg-blue-50";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadPortfolioData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Portfolio Overview</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Strategic view of all your businesses and their performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/management/summary">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              View Summary
            </Button>
          </Link>
          <Link href="/management/businesses/new">
            <Button>
              <Building2 className="h-4 w-4 mr-2" />
              Add Business
            </Button>
          </Link>
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Businesses</p>
                <p className="text-2xl font-semibold">{stats?.totalBusinesses || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Properties</p>
                <p className="text-2xl font-semibold">{stats?.totalProperties || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{stats?.totalUnits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Occupancy Rate</p>
                <p className="text-2xl font-semibold">{stats?.overallOccupancyRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--teal)]" />
              Business Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {businesses.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No businesses found</p>
                <p className="text-sm">Add your first business to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="p-4 rounded-lg border border-gray-100 hover:border-[var(--teal)] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[var(--main-text)]">{business.name}</h3>
                        <p className="text-sm text-[var(--secondary-text)]">{business.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(business.status)}
                        <Link href={`/management/dashboard?businessId=${business.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-[var(--secondary-text)]">Businesses</p>
                        <p className="font-medium">{business.associationCount}</p>
                      </div>
                      <div>
                        <p className="text-[var(--secondary-text)]">Properties</p>
                        <p className="font-medium">{business.propertyCount}</p>
                      </div>
                      <div>
                        <p className="text-[var(--secondary-text)]">Units</p>
                        <p className="font-medium">{business.unitCount}</p>
                      </div>
                      <div>
                        <p className="text-[var(--secondary-text)]">Open Maintenance</p>
                        <p className={`font-medium ${business.openMaintenanceCount > 0 ? "text-amber-600" : ""}`}>
                          {business.openMaintenanceCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--secondary-text)]">Occupancy</span>
                        <span className="font-medium">{business.occupancyRate}%</span>
                      </div>
                      <Progress value={business.occupancyRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Summary */}
        <div className="space-y-6">
          {/* Portfolio Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Portfolio Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p>No alerts</p>
                  <p className="text-sm">All businesses are healthy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 p-3 rounded-lg ${getAlertColor(alert.severity)}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/50">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm opacity-75">
                          {alert.businessName} • {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[var(--teal)]" />
                Portfolio Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[var(--secondary-text)]">Open Maintenance</span>
                <span className={`font-semibold ${stats?.totalOpenMaintenance ? "text-amber-600" : "text-green-600"}`}>
                  {stats?.totalOpenMaintenance || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--secondary-text)]">Urgent Items</span>
                <span className={`font-semibold ${stats?.totalUrgentItems ? "text-red-600" : "text-green-600"}`}>
                  {stats?.totalUrgentItems || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--secondary-text)]">Active Businesses</span>
                <span className="font-semibold text-green-600">
                  {businesses.filter((b) => b.status === "active").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--secondary-text)]">At Risk</span>
                <span className={`font-semibold ${businesses.filter((b) => b.status === "at_risk").length ? "text-red-600" : "text-green-600"}`}>
                  {businesses.filter((b) => b.status === "at_risk").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
