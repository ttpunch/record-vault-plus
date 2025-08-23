import { StatCard } from "@/components/ui/stat-card";
import { Calendar, Database, Clock, TrendingUp } from "lucide-react";

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
      />
      <StatCard
        title="This Month"
        value={thisMonth}
        description="Records added this month"
        icon={Calendar}
        trend={{ value: 8, isPositive: true }}
      />
      <StatCard
        title="This Week"
        value={thisWeek}
        description="Recent activity"
        icon={Clock}
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        title="Categories"
        value={categories}
        description="Unique categories"
        icon={TrendingUp}
        trend={{ value: 2, isPositive: true }}
      />
    </div>
  );
}