"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Upload, Folder, Download } from "lucide-react";

const documents = [
  { id: "1", name: "Insurance Certificate 2026.pdf", type: "Insurance", size: "2.4 MB", date: "2026-01-15" },
  { id: "2", name: "Annual Budget.xlsx", type: "Financial", size: "156 KB", date: "2026-01-10" },
  { id: "3", name: "HOA Rules & Regulations.pdf", type: "Legal", size: "1.2 MB", date: "2025-12-01" },
];

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Documents</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage documents and file storage</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Documents</p>
                <p className="text-2xl font-semibold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Folder className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Categories</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Expiring Soon</p>
                <p className="text-2xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Storage Used</p>
                <p className="text-2xl font-semibold">1.2 GB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-[var(--teal)]" />
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-[var(--secondary-text)]">
                      <Badge variant="secondary">{doc.type}</Badge>
                      <span>{doc.size}</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
