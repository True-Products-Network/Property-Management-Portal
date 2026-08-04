"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface SyncLog {
  id: string;
  connection_id: string;
  sync_type: string;
  status: string;
  records_processed: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  association_ghl_connections: {
    associations: {
      name: string;
      association_id: string;
    };
  };
}

export default function SyncLogsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/platform-login");
        return;
      }

      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .single();

      if (!platformRole) {
        router.push("/unauthorized");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("ghl_sync_logs")
        .select(`
          *,
          association_ghl_connections(
            associations(name, association_id)
          )
        `)
        .order("started_at", { ascending: false })
        .limit(100);

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data || []);
    } catch (e) {
      console.error("Error fetching sync logs:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Success</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case "running":
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Running</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDuration = (started: string, completed: string | null) => {
    if (!completed) return "In progress";
    const start = new Date(started).getTime();
    const end = new Date(completed).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;
    return `${minutes}m ${remaining}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform/integrations">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Integrations
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sync Logs</h1>
            <p className="text-gray-500">View GHL synchronization history</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{logs.length}</p>
          <p className="text-sm text-gray-500">Total Syncs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-green-600">
            {logs.filter(l => l.status === "success").length}
          </p>
          <p className="text-sm text-gray-500">Successful</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-red-600">
            {logs.filter(l => l.status === "failed").length}
          </p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold text-blue-600">
            {logs.filter(l => l.status === "running").length}
          </p>
          <p className="text-sm text-gray-500">Running</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Association</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No sync logs found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sync logs will appear here when associations run GHL syncs
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(log.started_at), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.association_ghl_connections?.associations?.name}</p>
                      <p className="text-xs text-gray-500">{log.association_ghl_connections?.associations?.association_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {log.sync_type}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-green-600">{log.records_processed}</span> processed
                      {log.records_failed > 0 && (
                        <span className="text-red-600 ml-2">{log.records_failed} failed</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getDuration(log.started_at, log.completed_at)}
                  </TableCell>
                  <TableCell>
                    {log.error_message ? (
                      <p className="text-sm text-red-600 truncate max-w-xs" title={log.error_message}>
                        {log.error_message}
                      </p>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
