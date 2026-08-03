// Recent Activity Component for Platform Dashboard

import { formatDistanceToNow } from "date-fns";
import { 
  UserPlus, 
  Building2, 
  CreditCard, 
  Settings, 
  AlertTriangle,
  Activity
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  action_category: string;
  actor_type: string;
  target_type: string;
  target_id: string;
  created_at: string;
  new_value: any;
}

interface RecentActivityProps {
  activities: Activity[];
}

const getActivityIcon = (category: string) => {
  switch (category) {
    case "tenant":
      return Building2;
    case "entitlement":
      return CreditCard;
    case "security":
      return UserPlus;
    case "integration":
      return Settings;
    default:
      return Activity;
  }
};

const getActivityDescription = (activity: Activity) => {
  switch (activity.action) {
    case "tenant_created":
      return "New tenant provisioned";
    case "tenant_updated":
      return "Tenant updated";
    case "subscription_updated":
      return "Subscription changed";
    case "platform_login":
      return "Platform login";
    case "role_granted":
      return "Role granted to user";
    default:
      return activity.action.replace(/_/g, " ");
  }
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
      </div>
      <div className="divide-y">
        {activities.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">No recent activity</p>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.action_category);
            return (
              <div key={activity.id} className="p-4 flex items-start space-x-3">
                <div className="p-2 bg-gray-100 rounded-full">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  {activity.new_value && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {JSON.stringify(activity.new_value).slice(0, 100)}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
