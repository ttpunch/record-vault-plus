import { StatCard } from "@/components/ui/stat-card";
import { Database, Calendar, Clock, Tag, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  totalRecords: number;
  thisMonth: number;
  thisWeek: number;
  categories: number;
}

export function StatsOverview({ totalRecords, thisMonth, thisWeek, categories }: StatsOverviewProps) {
  // Calculate some additional stats
  const completionRate = Math.min(100, Math.round((thisWeek / (thisMonth || 1)) * 100)) || 0;
  const pendingItems = Math.max(0, thisMonth - thisWeek);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Records"
        value={totalRecords}
        description="Lifetime tracked items"
        icon={Database}
        trend={{ value: 12, isPositive: true }}
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800"
      />
      <StatCard
        title="Monthly Activity"
        value={thisMonth}
        description={`${thisWeek} added this week`}
        icon={Calendar}
        trend={{ value: 8, isPositive: thisMonth > 0 }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
      <StatCard
        title="Completion Rate"
        value={`${completionRate}%`}
        description="Weekly progress"
        icon={completionRate > 70 ? CheckCircle : AlertTriangle}
        trend={{ value: 5, isPositive: completionRate > 70 }}
        className={cn(
          "bg-gradient-to-br border",
          completionRate > 70 
            ? "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800"
            : "from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800"
        )}
      />
      <StatCard
        title="Categories"
        value={categories}
        description={`${pendingItems} pending items`}
        icon={Tag}
        trend={{ value: 2, isPositive: true }}
        className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800"
      />
    </div>
  );
}