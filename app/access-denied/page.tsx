"use client";

import Link from "next/link";
import { ShieldAlert, Home, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--teal)] rounded-xl flex items-center justify-center">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">Associos</h1>
              <p className="text-sm text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-600">
              You don&apos;t have permission to access this area. This could be because:
            </p>
            
            <ul className="space-y-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                Your account hasn&apos;t been assigned a role yet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                Your invitation is still pending acceptance
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                You&apos;re trying to access an area restricted to other user types
              </li>
            </ul>

            <div className="space-y-3">
              <Link href="/sign-in">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
              
              <Link href="/">
                <Button variant="ghost" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-sm text-gray-500 mb-2">
                Need help? Contact your administrator or support.
              </p>
              <a 
                href="mailto:support@trueproductsnetwork.com"
                className="inline-flex items-center text-sm text-[var(--teal)] hover:text-[var(--teal-hover)]"
              >
                <Mail className="mr-1 h-4 w-4" />
                support@trueproductsnetwork.com
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/60">
          <p>Powered by Associos</p>
        </div>
      </div>
    </div>
  );
}
