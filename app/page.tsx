import Link from "next/link";
import { Building2, ArrowRight, Shield, Users, Wrench, FileText, CheckCircle2, Mail, Phone, Calendar, CreditCard, Lock, Zap, BarChart3 } from "lucide-react";

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
              <span className="font-semibold text-white text-lg">Associos</span>
              <span className="text-white/60 ml-2 text-sm">by True Products Network</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-in"
              className="btn btn-primary"
            >
              Access Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
              href="#demo"
              className="btn btn-secondary text-lg px-8 py-3 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              Request Demo
            </a>
          </div>
        </div>

        {/* Stakeholders Section */}
        <div id="features" className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            One Platform, Every Stakeholder
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StakeholderCard
              icon={Shield}
              title="Management"
              description="Full portfolio oversight, maintenance coordination, vendor management, and financial reporting"
            />
            <StakeholderCard
              icon={Users}
              title="Owners & Residents"
              description="Submit maintenance requests, view documents, pay assessments, and track community updates"
            />
            <StakeholderCard
              icon={FileText}
              title="Board Members"
              description="Review approvals, access financial reports, manage compliance, and oversee governance"
            />
            <StakeholderCard
              icon={Wrench}
              title="Vendors"
              description="Accept work orders, submit quotes, update job progress, and invoice for completed work"
            />
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Associos?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BenefitCard
              icon={Lock}
              title="Truly White-Label"
              description="Your logo, your colors, your domain. Clients never see our brand."
            />
            <BenefitCard
              icon={Zap}
              title="GoHighLevel Native"
              description="Built-in GHL integration means your CRM, automations, and workflows connect seamlessly."
            />
            <BenefitCard
              icon={Users}
              title="All Stakeholders, One Platform"
              description="Associations, owners, residents, board members, vendors, and staff each have tailored views."
            />
            <BenefitCard
              icon={CreditCard}
              title="Flat Pricing, No Surprises"
              description="Pay for properties, not per-unit. Add 100 units to one property at no extra cost."
            />
            <BenefitCard
              icon={BarChart3}
              title="Financial Hub Built-In"
              description="Invoicing, payment links, assessments, and reporting without separate accounting software."
            />
            <BenefitCard
              icon={Wrench}
              title="Maintenance to Compliance"
              description="From work orders to inspections to compliance tracking, operations are covered."
            />
            <BenefitCard
              icon={Mail}
              title="Document & Communication Center"
              description="Announcements, file sharing, appointments, and messaging in one place."
            />
            <BenefitCard
              icon={Shield}
              title="Board Governance Tools"
              description="Approvals, voting, meeting management, and audit trails for transparency."
            />
            <BenefitCard
              icon={Calendar}
              title="Fast Deployment"
              description="White-label setup in days, not months. Start billing your clients faster."
            />
            <BenefitCard
              icon={CheckCircle2}
              title="You Own the Relationship"
              description="Your clients, your data, your brand. We stay invisible."
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-white/60 text-center mb-12 max-w-2xl mx-auto">
            Pay for properties, not per-unit. Scale your portfolio without scaling your costs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard
              name="Starter"
              price="$149"
              period="/month"
              description="Perfect for small management companies"
              features={[
                "Up to 10 properties",
                "Unlimited units",
                "All core modules",
                "Email support",
                "Basic white-label",
              ]}
              cta="Start Free Trial"
              highlighted={false}
            />
            <PricingCard
              name="Professional"
              price="$299"
              period="/month"
              description="For growing property management firms"
              features={[
                "Up to 50 properties",
                "Unlimited units",
                "All core modules",
                "Priority support",
                "Advanced white-label",
                "Custom integrations",
              ]}
              cta="Start Free Trial"
              highlighted={true}
            />
            <PricingCard
              name="Enterprise"
              price="$599"
              period="/month"
              description="For large portfolios and multi-region operators"
              features={[
                "Unlimited properties",
                "Unlimited units",
                "All core modules",
                "24/7 phone support",
                "Full white-label suite",
                "Dedicated account manager",
                "Custom development",
              ]}
              cta="Contact Sales"
              highlighted={false}
            />
          </div>
        </div>

        {/* Comparison Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How We Compare
          </h2>
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/10 font-semibold text-white">
              <div>Feature</div>
              <div className="text-center">Associos</div>
              <div className="text-center text-white/60">Buildium</div>
              <div className="text-center text-white/60">Haus Financial</div>
            </div>
            <ComparisonRow feature="White-Label" associos="✓" buildium="✗" haus="✗" />
            <ComparisonRow feature="GHL Integration" associos="✓" buildium="✗" haus="✗" />
            <ComparisonRow feature="Flat Pricing (per property)" associos="✓" buildium="✗" haus="✗" />
            <ComparisonRow feature="All Stakeholder Portals" associos="✓" buildium="✓" haus="✓" />
            <ComparisonRow feature="Maintenance Management" associos="✓" buildium="✓" haus="✓" />
            <ComparisonRow feature="Financial Reporting" associos="✓" buildium="✓" haus="✓" />
            <ComparisonRow feature="Built-in Payment Processing" associos="✓" buildium="✓" haus="✓" />
            <ComparisonRow feature="Board Governance Tools" associos="✓" buildium="✗" haus="✗" />
            <ComparisonRow feature="Vendor Management" associos="✓" buildium="✓" haus="✗" />
            <ComparisonRow feature="Compliance Tracking" associos="✓" buildium="✗" haus="✗" />
          </div>
        </div>

        {/* Demo Request Section */}
        <div id="demo" className="mt-32">
          <div className="bg-[var(--teal)] rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  See Associos in Action
                </h2>
                <p className="text-white/90 mb-6">
                  Schedule a personalized demo with our team. We'll show you how Associos can transform your property management operations.
                </p>
                <ul className="space-y-3 text-white/90">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    30-minute personalized walkthrough
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    White-label setup demonstration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Q&A with our product experts
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6">
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent" placeholder="John" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent" placeholder="Doe" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent" placeholder="Your Property Management Company" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent" placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Properties</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent">
                      <option value="">Select...</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-100">51-100</option>
                      <option value="100+">100+</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-[var(--teal)] text-white font-semibold py-3 rounded-lg hover:bg-[var(--teal-hover)] transition-colors">
                    Request Demo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatCard number="100%" label="White Label" />
          <StatCard number="5" label="User Roles" />
          <StatCard number="13+" label="Modules" />
          <StatCard number="GHL" label="Integrated" />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--teal)] rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-semibold">Associos</span>
            </div>
            <p className="text-white/60 text-sm">
              © 2026 True Products Network LLC. All rights reserved.
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

function StakeholderCard({
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

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 bg-[var(--teal)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-6 w-6 text-[var(--teal)]" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        <p className="text-white/60 text-sm">{description}</p>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}) {
  return (
    <div className={`p-6 rounded-xl border ${highlighted ? 'bg-[var(--teal)] border-[var(--teal)]' : 'bg-white/5 border-white/10'}`}>
      <h3 className={`text-xl font-semibold mb-2 ${highlighted ? 'text-white' : 'text-white'}`}>{name}</h3>
      <p className={`text-sm mb-4 ${highlighted ? 'text-white/80' : 'text-white/60'}`}>{description}</p>
      <div className="mb-6">
        <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-white'}`}>{price}</span>
        <span className={highlighted ? 'text-white/80' : 'text-white/60'}>{period}</span>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className={`flex items-center gap-2 text-sm ${highlighted ? 'text-white/90' : 'text-white/70'}`}>
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <button className={`w-full py-2 rounded-lg font-semibold transition-colors ${highlighted ? 'bg-white text-[var(--teal)] hover:bg-white/90' : 'bg-[var(--teal)] text-white hover:bg-[var(--teal-hover)]'}`}>
        {cta}
      </button>
    </div>
  );
}

function ComparisonRow({
  feature,
  associos,
  buildium,
  haus,
}: {
  feature: string;
  associos: string;
  buildium: string;
  haus: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-4 p-4 border-b border-white/10 last:border-b-0 text-white/80">
      <div>{feature}</div>
      <div className="text-center text-[var(--teal)] font-semibold">{associos}</div>
      <div className="text-center">{buildium}</div>
      <div className="text-center">{haus}</div>
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
