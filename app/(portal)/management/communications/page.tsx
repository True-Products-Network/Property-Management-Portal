"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Send, Inbox, Mail } from "lucide-react";

const messages = [
  { id: "1", subject: "Pool Maintenance Schedule", from: "Sarah Johnson", date: "2026-07-30", type: "announcement" },
  { id: "2", subject: "Parking Violation Notice", from: "Mike Chen", date: "2026-07-29", type: "notice" },
  { id: "3", subject: "Annual Meeting Minutes", from: "Lisa Davis", date: "2026-07-28", type: "document" },
];

export default function CommunicationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Communications</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage messages and announcements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Announcement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Messages</p>
                <p className="text-2xl font-semibold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Sent This Month</p>
                <p className="text-2xl font-semibold">23</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Inbox className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unread</p>
                <p className="text-2xl font-semibold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{msg.subject}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">From: {msg.from}</p>
                  <p className="text-sm text-[var(--secondary-text)]">{msg.date}</p>
                </div>
                <Badge variant="secondary">{msg.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
