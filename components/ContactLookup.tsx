"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, X, Loader2 } from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
}

interface ContactLookupProps {
  value: string;
  displayName: string;
  onChange: (contactId: string, contactName: string, contactData: Partial<Contact>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  roleFilter?: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

export default function ContactLookup({
  value,
  displayName,
  onChange,
  label = "Contact",
  placeholder = "Search or create contact...",
  required = false,
  roleFilter,
}: ContactLookupProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [contactRoles, setContactRoles] = useState<DropdownOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: roleFilter || "",
  });

  // Fetch contact roles from dropdown_settings
  useEffect(() => {
    async function fetchRoles() {
      setIsLoadingRoles(true);
      try {
        const response = await fetch('/api/admin/dropdowns?recordType=contact&fieldName=role');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const roles = result.data.map((item: { value: string; label: string }) => ({
              value: item.value,
              label: item.label,
            }));
            setContactRoles(roles);
            // Set default role if roleFilter not provided
            if (!roleFilter && roles.length > 0) {
              setNewContact(prev => ({ ...prev, role: roles[0].value }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching contact roles:", error);
      } finally {
        setIsLoadingRoles(false);
      }
    }
    fetchRoles();
  }, [roleFilter]);

  // Search for existing contacts
  useEffect(() => {
    if (!showModal || searchQuery.length < 2) {
      setExistingContacts([]);
      return;
    }

    async function searchContacts() {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/contacts?search=${encodeURIComponent(searchQuery)}&pageSize=10`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.data) {
            setExistingContacts(result.data.data);
          }
        }
      } catch (error) {
        console.error("Error searching contacts:", error);
      } finally {
        setIsSearching(false);
      }
    }

    const timeout = setTimeout(searchContacts, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, showModal]);

  function handleSelectContact(contact: Contact) {
    onChange(contact.id, `${contact.firstName} ${contact.lastName}`, {
      email: contact.email,
      phone: contact.phone,
    });
    setShowModal(false);
    setSearchQuery("");
    setExistingContacts([]);
  }

  async function handleCreateContact() {
    if (!newContact.firstName || !newContact.lastName || !newContact.email) {
      alert("First name, last name, and email are required");
      return;
    }

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newContact.firstName,
          lastName: newContact.lastName,
          email: newContact.email,
          phone: newContact.phone,
          roleType: newContact.role,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create contact");
      }

      const contact = result.data;
      onChange(contact.id, `${contact.firstName} ${contact.lastName}`, {
        email: contact.email,
        phone: contact.phone,
      });

      // Reset and close
      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: roleFilter || "vendor_contact",
      });
      setShowNewContactForm(false);
      setShowModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create contact");
    }
  }

  function clearSelection() {
    onChange("", "", {});
  }

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {value ? (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex-1">
            <p className="font-medium">{displayName}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => setShowModal(true)}
        >
          <Search className="h-4 w-4 mr-2" />
          {placeholder}
        </Button>
      )}

      {/* Contact Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Select {label}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false);
                  setShowNewContactForm(false);
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showNewContactForm ? (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search contacts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Results */}
                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : existingContacts.length > 0 ? (
                    <div className="space-y-2">
                      {existingContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                          onClick={() => handleSelectContact(contact)}
                        >
                          <p className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{contact.email}</p>
                          {contact.phone && (
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : searchQuery.length >= 2 ? (
                    <p className="text-center text-gray-500 py-4">
                      No contacts found
                    </p>
                  ) : null}

                  {/* Create New */}
                  <div className="border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewContactForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Contact
                    </Button>
                  </div>
                </>
              ) : (
                /* New Contact Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        value={newContact.firstName}
                        onChange={(e) =>
                          setNewContact({ ...newContact, firstName: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        value={newContact.lastName}
                        onChange={(e) =>
                          setNewContact({ ...newContact, lastName: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact({ ...newContact, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    {isLoadingRoles ? (
                      <div className="flex items-center gap-2 p-2 border rounded-md">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-500">Loading roles...</span>
                      </div>
                    ) : (
                      <select
                        className="w-full p-2 border rounded-md"
                        value={newContact.role}
                        onChange={(e) =>
                          setNewContact({ ...newContact, role: e.target.value })
                        }
                      >
                        {contactRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewContactForm(false)}
                    >
                      Back
                    </Button>
                    <Button type="button" onClick={handleCreateContact}>
                      Create Contact
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
