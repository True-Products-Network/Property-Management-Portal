"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Link2,
  Send,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function CreatePaymentLinkPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdLink, setCreatedLink] = useState<{
    url: string;
    amount: number;
    paymentRecordId: string;
  } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    contactId: "",
    name: "",
    description: "",
    amount: "",
    sendEmail: true,
    sendSms: false,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      const response = await fetch("/api/contacts");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setContacts(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.contactId || !formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId,
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          sendEmail: formData.sendEmail,
          sendSms: formData.sendSms,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCreatedLink({
            url: result.data.url,
            amount: result.data.amount,
            paymentRecordId: result.data.paymentRecordId,
          });
          setIsCreated(true);
        } else {
          alert(result.error || "Failed to create payment link");
        }
      } else {
        alert("Failed to create payment link");
      }
    } catch (error) {
      console.error("Error creating payment link:", error);
      alert("An error occurred while creating the payment link");
    } finally {
      setIsLoading(false);
    }
  }

  function copyToClipboard() {
    if (createdLink?.url) {
      navigator.clipboard.writeText(createdLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (isCreated && createdLink) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/management/payments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              Payment Link Created
            </h1>
          </div>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Payment Link Ready!
            </h2>
            <p className="text-green-700 mb-4">
              Amount: ${createdLink.amount.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={createdLink.url}
                readOnly
                className="flex-1"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className={copied ? "bg-green-100" : ""}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-[var(--secondary-text)]">
              Share this link with the contact to collect payment. The link will
              redirect them to a secure payment page.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Link href="/management/payments">
            <Button variant="outline">Back to Payments</Button>
          </Link>
          <Button
            onClick={() => {
              setIsCreated(false);
              setCreatedLink(null);
              setFormData({
                contactId: "",
                name: "",
                description: "",
                amount: "",
                sendEmail: true,
                sendSms: false,
              });
            }}
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
          >
            Create Another Link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Create Payment Link
          </h1>
          <p className="text-[var(--secondary-text)]">
            Generate a quick payment link via GoHighLevel
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-[var(--teal)]" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Contact <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.contactId}
                onChange={(e) =>
                  setFormData({ ...formData, contactId: e.target.value })
                }
                className="input w-full"
                required
              >
                <option value="">Select Contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} ({contact.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Payment Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Late Fee Payment"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="input w-full"
                placeholder="Optional description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Amount ($) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[var(--teal)]" />
              Delivery Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendEmail}
                onChange={(e) =>
                  setFormData({ ...formData, sendEmail: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span>Send link via email</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendSms}
                onChange={(e) =>
                  setFormData({ ...formData, sendSms: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span>Send link via SMS</span>
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/management/payments">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 mr-2" />
                Create Payment Link
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
