import Link from "next/link";
import { Building2, ArrowRight, Shield, Users, Wrench, FileText } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--primary-navy)]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--teal)] rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-semibold text-white text-lg">Exemplary</span>
              <span className="text-white/60 ml-2">Property Management</span>
            </div>
          </div>
          <Link
            href="/sign-in"
            className="btn btn-primary"
          >
            Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Property Management Portal
          </h1>
          <p className="text-xl text-white/70 mb-10">
            A unified platform for associations, owners, board members, and vendors 
            to manage properties, maintenance, and communications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-in"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Access Portal
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="btn btn-secondary text-lg px-8 py-3 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={Shield}
            title="Management"
            description="Full portfolio oversight, maintenance coordination, and vendor management"
          />
          <FeatureCard
            icon={Users}
            title="Owners & Residents"
            description="Submit requests, view documents, and track maintenance status"
          />
          <FeatureCard
            icon={FileText}
            title="Board Members"
            description="Review approvals, access reports, and manage compliance"
          />
          <FeatureCard
            icon={Wrench}
            title="Vendors"
            description="Accept jobs, submit quotes, and update work progress"
          />
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatCard number="114" label="Portal Screens" />
          <StatCard number="5" label="Access Levels" />
          <StatCard number="4" label="Portal Versions" />
          <StatCard number="1" label="Unified Platform" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm">
              © 2026 Exemplary Property Management. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-white/60 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-white/60 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/help" className="text-white/60 hover:text-white text-sm">
                Help & Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 bg-[var(--teal)] rounded-lg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-[var(--teal)] mb-1">{number}</div>
      <div className="text-white/60 text-sm">{label}</div>
    </div>
  );
}
