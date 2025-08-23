import { StatCard } from "@/components/ui/stat-card";
import { Calendar, Database, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  totalRecords: number;
  thisMonth: number;
  thisWeek: number;
  categories: number;
}

export function StatsOverview({ totalRecords, thisMonth, thisWeek, categories }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Records"
        value={totalRecords}
        description="All recorded events"
        icon={Database}
        trend={{ value: 12, isPositive: true }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
      <StatCard
        title="This Month"
        value={thisMonth}
        description="Records added this month"
        icon={Calendar}
        trend={{ value: 8, isPositive: true }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
      <StatCard
        title="This Week"
        value={thisWeek}
        description="Recent activity"
        icon={Clock}
        trend={{ value: 5, isPositive: true }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
      <StatCard
        title="Categories"
        value={categories}
        description="Unique categories"
        icon={TrendingUp}
        trend={{ value: 2, isPositive: true }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800"
      />
    </div>
  );
}