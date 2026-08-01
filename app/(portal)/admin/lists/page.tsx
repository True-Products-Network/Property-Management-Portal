"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { List, ArrowLeft, Tag, FolderTree } from "lucide-react";

interface ListCategory {
  id: string;
  name: string;
  description: string;
  count: number;
}

export default function AdminListsPage() {
  const [categories, setCategories] = useState<ListCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch dropdown categories from the database
    async function fetchCategories() {
      try {
        const response = await fetch("/api/admin/settings?category=dropdown");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Group by record_type to get unique categories
            const types = new Map<string, number>();
            result.data.forEach((item: { record_type: string }) => {
              types.set(item.record_type, (types.get(item.record_type) || 0) + 1);
            });

            const mappedCategories: ListCategory[] = Array.from(types.entries()).map(([name, count]) => ({
              id: name,
              name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              description: `Manage ${name.replace(/_/g, " ")} options`,
              count,
            }));

            setCategories(mappedCategories);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Category Management</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage custom categories for your data</p>
        </div>
      </div>

      {/* Under Construction Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 pb-6 text-center">
          <FolderTree className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h2 className="text-xl font-semibold text-amber-800 mb-2">
            Category Management - Under Construction
          </h2>
          <p className="text-amber-700 mb-4 max-w-md mx-auto">
            This feature is currently being developed. You will be able to create and manage 
            custom categories for organizing your properties, units, and other data.
          </p>
          <p className="text-sm text-amber-600">
            For now, please use <Link href="/admin/dropdowns" className="underline font-medium">Dropdown Settings</Link> to manage list values.
          </p>
        </CardContent>
      </Card>

      {/* Existing Categories Preview */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-[var(--teal)]" />
              Existing Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--secondary-text)] mb-4">
              These categories are currently managed through Dropdown Settings:
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="px-3 py-1 bg-[var(--page-background)] rounded-full text-sm text-[var(--main-text)]"
                >
                  {category.name} ({category.count})
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Need to manage dropdown values?</strong> Use{" "}
            <Link href="/admin/dropdowns" className="underline text-blue-600">
              Dropdown Settings
            </Link>{" "}
            to configure all dropdown options across the system.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
