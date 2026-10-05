import { History } from "lucide-react";
import Spinner from "./Spinner";
import EmptyState from "./EmptyState";
import type { Activity } from "../lib/types";

interface ActivityFeedProps {
  activities: Activity[];
  isLoading: boolean;
}

const relative = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) return <Spinner label="Loading activity" />;
  if (activities.length === 0) {
    return <EmptyState icon={<History size={28} />} title="No activity yet" description="Card and column changes show up here." />;
  }

  return (
    <ol className="flex flex-col gap-3">
      {activities.map((activity) => (
        <li key={activity.id} className="flex gap-3">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
          <div className="min-w-0">
            <p className="text-sm text-slate-700">{activity.message}</p>
            <p className="text-xs text-slate-400">{relative(activity.createdAt)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
