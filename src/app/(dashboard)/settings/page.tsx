// Force dynamic rendering - these pages require database access
export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Email</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Plan</p>
              <p className="text-sm text-gray-500">Current subscription tier</p>
            </div>
            <Badge variant={user.plan === "FREE" ? "secondary" : "default"}>
              {user.plan}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Monthly Limit</p>
              <p className="text-sm text-gray-500">
                Contract analyses per month
              </p>
            </div>
            <p className="font-medium">
              {user.contractsAnalyzed} / {user.monthlyLimit}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
          <CardDescription>
            Manage your data and privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Data Retention</p>
              <p className="text-sm text-gray-500">
                Contracts are automatically deleted after 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
