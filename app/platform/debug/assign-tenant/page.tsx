"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Building2,
  Home,
  Users,
  Wrench,
  Truck,
  ClipboardCheck,
  FileText,
  CheckSquare,
  Scale,
  CircleDollarSign,
  MessageSquare,
  ArrowRight,
  Search
} from "lucide-react";

interface EntityRecord {
  id: string;
  name?: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  unit_number?: string;
  created_at: string;
  selected?: boolean;
}

interface EntityType {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  nameField: string;
}

const entityTypes: EntityType[] = [
  { key: "associations", label: "Associations", icon: Building2, nameField: "name" },
  { key: "properties", label: "Properties", icon: Home, nameField: "name" },
  { key: "units", label: "Units", icon: Users, nameField: "unit_number" },
  { key: "contacts", label: "Contacts", icon: Users, nameField: "first_name" },
  { key: "vendors", label: "Vendors", icon: Truck, nameField: "company_name" },
  { key: "maintenance_requests", label: "Maintenance", icon: Wrench, nameField: "title" },
  { key: "inspections", label: "Inspections", icon: ClipboardCheck, nameField: "title" },
  { key: "documents", label: "Documents", icon: FileText, nameField: "name" },
  { key: "approvals", label: "Approvals", icon: CheckSquare, nameField: "title" },
  { key: "compliance_matters", label: "Compliance", icon: Scale, nameField: "title" },
  { key: "payment_records", label: "Payments", icon: CircleDollarSign, nameField: "description" },
  { key: "communications", label: "Communications", icon: MessageSquare, nameField: "subject" },
];

export default function AssignTenantPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [orphanedRecords, setOrphanedRecords] = useState<Record<string, EntityRecord[]>>({});
  const [selectedRecords, setSelectedRecords] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    const { data } = await supabase
      .from("tenants")
      .select("id, name, code")
      .order("name");
    setTenants(data || []);
  }

  async function scanOrphaned() {
    try {
      setScanning(true);
      setError(null);
      setOrphanedRecords({});
      setSelectedRecords({});
      setResults(null);

      const records: Record<string, EntityRecord[]> = {};
      const selected: Record<string, Set<string>> = {};

      for (const entity of entityTypes) {
        console.log(`[AssignTenant] Scanning ${entity.key}...`);
        
        // First check if table exists and has records
        const { count: totalCount } = await supabase
          .from(entity.key)
          .select("id", { count: "exact", head: true });
        
        console.log(`[AssignTenant] ${entity.key} total records:`, totalCount);
        
        // Check records with NULL tenant_id
        const { count: nullTenantCount } = await supabase
          .from(entity.key)
          .select("id", { count: "exact", head: true })
          .is("tenant_id", null);
        
        console.log(`[AssignTenant] ${entity.key} with NULL tenant_id:`, nullTenantCount);
        
        // Check records with NULL tenant_id AND NULL business_id
        const { count: bothNullCount } = await supabase
          .from(entity.key)
          .select("id", { count: "exact", head: true })
          .is("tenant_id", null)
          .is("business_id", null);
        
        console.log(`[AssignTenant] ${entity.key} with NULL tenant_id AND NULL business_id:`, bothNullCount);
        
        const { data } = await supabase
          .from(entity.key)
          .select(`id, ${entity.nameField}, created_at`)
          .is("tenant_id", null)
          .is("business_id", null)
          .order("created_at", { ascending: false })
          .limit(50);

        console.log(`[AssignTenant] ${entity.key} data returned:`, data?.length || 0);

        if (data && data.length > 0) {
          records[entity.key] = data.map((r: any) => ({ ...r, selected: false }));
          selected[entity.key] = new Set();
        }
      }
      
      console.log('[AssignTenant] Total orphaned records found:', Object.values(records).reduce((sum, arr) => sum + arr.length, 0));

      setOrphanedRecords(records);
      setSelectedRecords(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  function toggleRecord(entityKey: string, recordId: string) {
    setSelectedRecords(prev => {
      const newSet = new Set(prev[entityKey]);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return { ...prev, [entityKey]: newSet };
    });
  }

  function toggleAll(entityKey: string) {
    const records = orphanedRecords[entityKey];
    const currentSelected = selectedRecords[entityKey];
    
    if (currentSelected.size === records.length) {
      // Deselect all
      setSelectedRecords(prev => ({ ...prev, [entityKey]: new Set() }));
    } else {
      // Select all
      setSelectedRecords(prev => ({ 
        ...prev, 
        [entityKey]: new Set(records.map(r => r.id)) 
      }));
    }
  }

  async function assignTenant() {
    if (!selectedTenant) {
      setError("Please select a target tenant");
      return;
    }

    const totalSelected = Object.values(selectedRecords).reduce(
      (sum, set) => sum + set.size, 0
    );

    if (totalSelected === 0) {
      setError("Please select at least one record");
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      setResults(null);

      const results: Record<string, { success: number; error: number }> = {};

      for (const entity of entityTypes) {
        const idsToUpdate = Array.from(selectedRecords[entity.key] || []);
        if (idsToUpdate.length === 0) continue;

        let success = 0;
        let error = 0;

        for (const id of idsToUpdate) {
          const { error: updateError } = await supabase
            .from(entity.key)
            .update({ tenant_id: selectedTenant })
            .eq("id", id);

          if (updateError) {
            error++;
          } else {
            success++;
          }
        }

        results[entity.key] = { success, error };
      }

      setResults(results);
      
      // Refresh the scan
      await scanOrphaned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(false);
    }
  }

  const totalOrphaned = Object.values(orphanedRecords).reduce(
    (sum, records) => sum + records.length, 0
  );

  const totalSelected = Object.values(selectedRecords).reduce(
    (sum, set) => sum + set.size, 0
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Assign Tenant to Orphaned Records</h1>
        <p className="text-gray-600 mt-1">
          Find records with no tenant_id and assign them to the correct tenant
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Scan for Records Without Tenant ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will find all records that have NULL tenant_id AND NULL business_id
          </p>
          <Button onClick={scanOrphaned} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Scan for Orphaned Records
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {totalOrphaned > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Found {totalOrphaned} Records Without Tenant ID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 2: Select Target Tenant */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <Label className="text-base font-medium mb-2 block">
                Step 2: Select Target Tenant
              </Label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Choose a tenant..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Select Records */}
            <div>
              <Label className="text-base font-medium mb-4 block">
                Step 3: Select Records to Assign ({totalSelected} selected)
              </Label>
              
              <div className="space-y-4">
                {entityTypes.map(entity => {
                  const records = orphanedRecords[entity.key] || [];
                  if (records.length === 0) return null;
                  
                  const Icon = entity.icon;
                  const selectedCount = selectedRecords[entity.key]?.size || 0;
                  
                  return (
                    <Card key={entity.key} className="border-gray-200">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {entity.label}
                            <span className="text-sm font-normal text-gray-500">
                              ({records.length} records, {selectedCount} selected)
                            </span>
                          </CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleAll(entity.key)}
                          >
                            {selectedCount === records.length ? "Deselect All" : "Select All"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="max-h-48 overflow-y-auto space-y-2">
                          {records.map((record: EntityRecord) => {
                            const displayName = record[entity.nameField as keyof EntityRecord] || 
                              `${record.first_name || ''} ${record.last_name || ''}`.trim() ||
                              record.id.slice(0, 8);
                            
                            return (
                              <div 
                                key={record.id}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                              >
                                <Checkbox
                                  checked={selectedRecords[entity.key]?.has(record.id)}
                                  onClick={() => toggleRecord(entity.key, record.id)}
                                />
                                <span className="flex-1 text-sm">{displayName}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(record.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Assign */}
            <div className="flex justify-end">
              <Button 
                onClick={assignTenant}
                disabled={assigning || totalSelected === 0 || !selectedTenant}
                className="bg-amber-600 hover:bg-amber-700"
                size="lg"
              >
                {assigning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Assign {totalSelected} Records to Tenant
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {totalOrphaned === 0 && !scanning && Object.keys(orphanedRecords).length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              No Orphaned Records Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-800">
              All records have a tenant_id assigned. You can now use the Business Record Fix tool 
              to assign business_ids.
            </p>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Assignment Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(results).map(([entity, result]: [string, any]) => (
                <div key={entity} className="flex justify-between text-sm">
                  <span className="capitalize">{entity.replace(/_/g, ' ')}:</span>
                  <span className={result.error > 0 ? "text-amber-700" : "text-green-700"}>
                    {result.success} success{result.error > 0 ? `, ${result.error} error` : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
