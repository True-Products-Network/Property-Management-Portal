"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { List, ArrowLeft, ChevronRight, Tag, Settings } from "lucide-react";

interface ListCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  icon: typeof Tag;
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
              description: `Manage ${name.replace(/_/g, " ")} dropdown options`,
              count,
              icon: Tag,
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

  const staticCategories: ListCategory[] = [
    {
      id: "dropdowns",
      name: "Dropdown Settings",
      description: "Manage all dropdown values and options",
      count: 0,
      icon: Settings,
    },
  ];

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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">System Lists</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage dropdown values and categories</p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dropdown Settings Card */}
        <Link href="/admin/dropdowns">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-[var(--teal)]" />
                </div>
                <ChevronRight className="h-5 w-5 text-[var(--secondary-text)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--main-text)] mt-4">
                Dropdown Settings
              </h3>
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Manage all dropdown values, options, and categories
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* Category List - Coming Soon */}
        <Card className="opacity-60">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <List className="h-6 w-6 text-[var(--secondary-text)]" />
              </div>
              <span className="text-xs text-[var(--secondary-text)] bg-gray-100 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--main-text)] mt-4">
              Category Management
            </h3>
            <p className="text-sm text-[var(--secondary-text)] mt-1">
              Create and organize custom categories for your data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Use Dropdown Settings to manage all dropdown options across the system. 
            Categories can be used for properties, units, maintenance types, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
