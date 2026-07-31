"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, DollarSign, TrendingUp, AlertCircle } from "lucide-react";

const payments = [
  { id: "1", description: "Monthly HOA Dues - Unit 1N", amount: "$350.00", date: "2026-07-01", status: "paid" },
  { id: "2", description: "Special Assessment - Roof", amount: "$500.00", date: "2026-07-15", status: "pending" },
  { id: "3", description: "Late Fee - Unit 3S", amount: "$25.00", date: "2026-07-10", status: "overdue" },
];

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Payments</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage payments and billing</p>
        </div>
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Collected</p>
                <p className="text-2xl font-semibold">$24,500</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">This Month</p>
                <p className="text-2xl font-semibold">$8,200</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending</p>
                <p className="text-2xl font-semibold">$3,400</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Overdue</p>
                <p className="text-2xl font-semibold">$1,200</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{payment.description}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">{payment.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{payment.amount}</p>
                  <Badge className={
                    payment.status === "paid" ? "bg-green-100 text-green-700" :
                    payment.status === "overdue" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
