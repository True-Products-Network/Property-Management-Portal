"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  HelpCircle, 
  Book, 
  MessageSquare, 
  Video, 
  Mail, 
  Phone,
  FileText,
  ExternalLink
} from "lucide-react";

const helpTopics = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of using the Property Management Portal",
    links: [
      { label: "Quick Start Guide", href: "#" },
      { label: "Dashboard Overview", href: "#" },
      { label: "Setting Up Your First Property", href: "#" },
    ],
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Detailed guides for all features and functions",
    links: [
      { label: "User Manual", href: "#" },
      { label: "API Documentation", href: "#" },
      { label: "Integration Guides", href: "#" },
    ],
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video walkthroughs",
    links: [
      { label: "Introduction Video", href: "#" },
      { label: "Maintenance Requests", href: "#" },
      { label: "Reports & Analytics", href: "#" },
    ],
  },
];

const faqs = [
  {
    question: "How do I add a new property?",
    answer: "Navigate to Properties in the sidebar, click 'Add Property', and fill in the required information including address, type, and association.",
  },
  {
    question: "How do I schedule an inspection?",
    answer: "Go to Inspections, click 'Schedule Inspection', select the property/unit, choose the inspection type, and set the date/time.",
  },
  {
    question: "Can I integrate with my existing calendar?",
    answer: "Yes! Go to Admin → Integrations → Calendar Integration to connect your GHL or other calendar provider.",
  },
  {
    question: "How do I generate reports?",
    answer: "Visit the Reports section, select your desired report type, apply any filters, and click Generate Report.",
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Help & Support</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Find answers, documentation, and get support
        </p>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[var(--teal)] to-[var(--teal)]/80 text-white">
          <CardContent className="p-6">
            <Mail className="h-8 w-8 mb-3" />
            <h3 className="font-semibold text-lg">Email Support</h3>
            <p className="text-white/80 text-sm mt-1">
              Get help via email
            </p>
            <a 
              href="mailto:support@example.com" 
              className="text-white underline mt-3 inline-block text-sm"
            >
              support@example.com
            </a>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[var(--primary-navy)] to-[var(--primary-navy)]/80 text-white">
          <CardContent className="p-6">
            <Phone className="h-8 w-8 mb-3" />
            <h3 className="font-semibold text-lg">Phone Support</h3>
            <p className="text-white/80 text-sm mt-1">
              Call us directly
            </p>
            <a 
              href="tel:+15551234567" 
              className="text-white underline mt-3 inline-block text-sm"
            >
              (555) 123-4567
            </a>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <MessageSquare className="h-8 w-8 mb-3" />
            <h3 className="font-semibold text-lg">Live Chat</h3>
            <p className="text-white/80 text-sm mt-1">
              Chat with our team
            </p>
            <Button 
              variant="outline" 
              className="mt-3 bg-white/10 border-white text-white hover:bg-white/20"
              size="sm"
            >
              Start Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Help Topics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {helpTopics.map((topic) => (
          <Card key={topic.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <topic.icon className="h-5 w-5 text-[var(--teal)]" />
                {topic.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--secondary-text)] mb-4">
                {topic.description}
              </p>
              <ul className="space-y-2">
                {topic.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[var(--teal)]" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-[var(--border-color)] last:border-0 pb-4 last:pb-0">
                <h4 className="font-medium text-[var(--main-text)] mb-2">
                  {faq.question}
                </h4>
                <p className="text-sm text-[var(--secondary-text)]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
