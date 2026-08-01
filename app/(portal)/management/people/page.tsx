"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  Home,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  User,
  UserCog,
} from "lucide-react";

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  preferredContactMethod?: string;
  mailingPreference?: string;
  emailPermission: boolean;
  smsPermission: boolean;
  portalInvitationStatus: string;
  createdAt: string;
}

export default function PeoplePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/contacts");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load contacts");
      }
      
      setContacts(result.data.data || []);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setError(error instanceof Error ? error.message : "Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = 
      contact.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.phone || "").includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || contact.portalInvitationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getPortalBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "invited":
        return <Badge className="bg-amber-100 text-amber-700">Invited</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">No Access</Badge>;
    }
  };

  const getPreferredContactBadge = (method?: string) => {
    switch (method) {
      case "email":
        return <Badge className="bg-blue-100 text-blue-700">Email</Badge>;
      case "phone":
        return <Badge className="bg-green-100 text-green-700">Phone</Badge>;
      case "sms":
        return <Badge className="bg-purple-100 text-purple-700">SMS</Badge>;
      case "mail":
        return <Badge className="bg-amber-100 text-amber-700">Mail</Badge>;
      default:
        return null;
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
        <p className="text-red-500">{error}</p>
        <Button onClick={loadContacts} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Contacts</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage property owners, tenants, and other contacts
          </p>
        </div>
        <Link href="/management/people/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Contacts</p>
                <p className="text-2xl font-semibold">{contacts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Portal Active</p>
                <p className="text-2xl font-semibold">
                  {contacts.filter((c) => c.portalInvitationStatus === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Invited</p>
                <p className="text-2xl font-semibold">
                  {contacts.filter((c) => c.portalInvitationStatus === "invited").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Email Opt-in</p>
                <p className="text-2xl font-semibold">
                  {contacts.filter((c) => c.emailPermission).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Portal Status</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="none">No Access</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Contact Info
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Preferred
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Portal Access
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Permissions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/people/${contact.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-[var(--secondary-text)]" />
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[var(--teal)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {contact.email}
                          </a>
                        </div>
                        {(contact.phone || contact.mobilePhone) && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-[var(--secondary-text)]" />
                            <span className="text-[var(--secondary-text)]">
                              {contact.phone || contact.mobilePhone}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getPreferredContactBadge(contact.preferredContactMethod)}
                    </td>
                    <td className="py-3 px-4">
                      {getPortalBadge(contact.portalInvitationStatus)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        {contact.emailPermission && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Email</Badge>
                        )}
                        {contact.smsPermission && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">SMS</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/people/${contact.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredContacts.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all"
                ? "No contacts found matching your criteria."
                : "No contacts yet. Click 'Add Contact' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
