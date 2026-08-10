"use client";

import { useState, useEffect } from "react";
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
      { label: "Quick Start Guide", href: "/management/help/docs" },
      { label: "Dashboard Overview", href: "/management/help/docs" },
      { label: "Setting Up Your First Property", href: "/management/help/docs" },
    ],
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Detailed guides for all features and functions",
    links: [
      { label: "User Manual", href: "/management/help/docs" },
      { label: "Integration Guides", href: "/management/help/docs" },
    ],
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Step-by-step video walkthroughs",
    links: [
      { label: "Introduction Video (Coming Soon)", href: "#" },
      { label: "Maintenance Requests (Coming Soon)", href: "#" },
      { label: "Reports & Analytics (Coming Soon)", href: "#" },
    ],
  },
];

const faqs = [
  {
    question: "How do I add a new association?",
    answer: "Navigate to Associations in the sidebar, click 'Add Association', and fill in the required information including association name, type (HOA, Condo, etc.), and address. You can also add board members and configure association settings during setup.",
  },
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
    answer: "Yes! Calendar integration is available for Admin users. Go to Admin → Integrations → Calendar Integration to connect your GHL or other calendar provider. This allows scheduling inspections and appointments directly through your integrated calendar.",
  },
  {
    question: "How do I generate reports?",
    answer: "Visit the Reports section, select your desired report type, apply any filters (association, property, date range), and click Generate Report. Reports can be downloaded as CSV files and are automatically saved to your Documents.",
  },
  {
    question: "How do I add users to the portal?",
    answer: "Admin users can add contacts through the People section. Each contact can be assigned roles such as Owner, Tenant, or Board Member. Portal access can be configured with specific permissions for each user.",
  },
  {
    question: "What are dropdown settings and how do I customize them?",
    answer: "Dropdown settings control the options available in various fields throughout the portal (like inspection types, vendor types, contact roles). Admin users can customize these in Admin → Dropdown Settings. Each tenant's dropdowns are isolated, so changes won't affect other organizations.",
  },
  {
    question: "How do I set up GHL (GoHighLevel) integration?",
    answer: "Go to Admin → Integrations → GHL. Enter your GHL API key, test the connection, and configure sync settings. You can sync contacts, calendar events, and communications. Each association can also have its own GHL location for separate data streams.",
  },
  {
    question: "What's the difference between Contacts and Users?",
    answer: "Contacts are people associated with properties (owners, tenants, vendors, board members). Users are people who can log into the portal. A contact becomes a user when you grant them portal access with a specific role (Admin, Property Manager, etc.).",
  },
  {
    question: "How do I assign a vendor to a maintenance request?",
    answer: "Open the maintenance request, click 'Assign Vendor', and select from your vendor list. The vendor will be linked to the request and can be notified. You can also track estimated and actual costs, and escalate urgent issues.",
  },
  {
    question: "What inspection types are available?",
    answer: "The portal supports: Routine, Move-in, Move-out, Annual, Fire Safety, Elevator, HVAC, Roof, Pool, Emergency Systems, and Insurance inspections. Admin users can customize available types in Dropdown Settings.",
  },
  {
    question: "How do approval workflows work?",
    answer: "Approval workflows allow board members to review and approve expenses, contracts, and policy changes. Submit an approval request with details and attachments, and assigned approvers will be notified. They can approve, reject, or request more information.",
  },
];

export default function HelpPage() {
  const [chatWidgetCode, setChatWidgetCode] = useState<string>("");
  const [enableLiveChat, setEnableLiveChat] = useState<boolean>(false);

  useEffect(() => {
    // Fetch chat widget settings
    fetch("/api/settings?category=branding")
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setChatWidgetCode(result.data.ghl_chat_widget_code || "");
          setEnableLiveChat(result.data.enable_live_chat === "true");
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

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
              href="mailto:support@trueproductsnetwork.com" 
              className="text-white underline mt-3 inline-block text-sm"
            >
              support@trueproductsnetwork.com
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
              href="tel:+13149153356" 
              className="text-white underline mt-3 inline-block text-sm"
            >
              (314) 915-3356
            </a>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <MessageSquare className="h-8 w-8 mb-3" />
            <h3 className="font-semibold text-lg">Live Chat</h3>
            <p className="text-white/80 text-sm mt-1">
              {enableLiveChat ? "Chat with our team" : "Live chat not configured"}
            </p>
            {enableLiveChat ? (
              <p className="text-white/60 text-xs mt-3">
                Use the chat widget in the bottom corner
              </p>
            ) : (
              <p className="text-white/60 text-xs mt-3">
                Contact your admin to enable live chat
              </p>
            )}
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
                      target="_blank"
                      rel="noopener noreferrer"
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

      {/* Chat Widget Script */}
      {enableLiveChat && chatWidgetCode && (
        <div dangerouslySetInnerHTML={{ __html: chatWidgetCode }} />
      )}
    </div>
  );
}
