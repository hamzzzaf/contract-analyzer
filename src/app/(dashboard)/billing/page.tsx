// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 contract analyses per month",
      "PDF & DOCX support",
      "Basic risk scoring",
      "7-day data retention",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    features: [
      "50 contract analyses per month",
      "PDF & DOCX support",
      "Advanced risk scoring",
      "30-day data retention",
      "PDF report export",
      "Priority support",
    ],
    current: false,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    features: [
      "Unlimited contract analyses",
      "PDF & DOCX support",
      "Advanced risk scoring",
      "90-day data retention",
      "PDF report export",
      "API access",
      "Custom integrations",
      "Dedicated support",
    ],
    current: false,
  },
];

export default async function BillingPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-gray-600">Manage your subscription and billing</p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={user.plan === "FREE" ? "secondary" : "default"}>
                {user.plan}
              </Badge>
              <div>
                <p className="font-medium">
                  {user.contractsAnalyzed} of {user.monthlyLimit} analyses used
                </p>
                <p className="text-sm text-gray-500">Resets on the 1st of each month</p>
              </div>
            </div>
            {user.plan !== "ENTERPRISE" && (
              <Button variant="outline">Upgrade Plan</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan: { name: string; price: string; period: string; features: string[]; current: boolean }) => (
            <Card
              key={plan.name}
              className={
                plan.name.toUpperCase() === user.plan ? "border-primary" : ""
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.name.toUpperCase() === user.plan && (
                    <Badge>Current</Badge>
                  )}
                </div>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    {plan.price}
                  </span>{" "}
                  {plan.period}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.name.toUpperCase() !== user.plan && (
                  <Button className="mt-4 w-full" variant="outline">
                    {plan.name === "Free" ? "Downgrade" : "Upgrade"} to{" "}
                    {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
