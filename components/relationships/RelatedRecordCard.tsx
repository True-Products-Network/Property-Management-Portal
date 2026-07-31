"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Building2, Home, Users, Wrench, FileText, ClipboardCheck, Scale, Truck } from "lucide-react";

type RecordType = "association" | "property" | "unit" | "contact" | "maintenance" | "document" | "inspection" | "compliance" | "vendor";

interface RelatedRecordCardProps {
  type: RecordType;
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  badge?: string;
  href: string;
}

const iconMap: Record<RecordType, React.ComponentType<{ className?: string }>> = {
  association: Building2,
  property: Home,
  unit: Home,
  contact: Users,
  maintenance: Wrench,
  document: FileText,
  inspection: ClipboardCheck,
  compliance: Scale,
  vendor: Truck,
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
  scheduled: "bg-[var(--teal)]/10 text-[var(--teal)]",
  completed: "bg-green-100 text-green-700",
  new: "bg-blue-100 text-blue-700",
};

export function RelatedRecordCard({
  type,
  id,
  title,
  subtitle,
  status,
  badge,
  href,
}: RelatedRecordCardProps) {
  const Icon = iconMap[type];

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--page-background)] flex items-center justify-center flex-shrink-0">
              <Icon className="h-5 w-5 text-[var(--teal)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-[var(--main-text)] truncate">{title}</h4>
                <ArrowRight className="h-4 w-4 text-[var(--secondary-text)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {subtitle && (
                <p className="text-sm text-[var(--secondary-text)] truncate">{subtitle}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {status && (
                  <Badge className={statusColors[status] || "bg-gray-100 text-gray-700"}>
                    {status}
                  </Badge>
                )}
                {badge && (
                  <Badge variant="secondary">{badge}</Badge>
                )}
                <span className="text-xs text-[var(--secondary-text)]">{id}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
