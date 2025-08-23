import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReminderBadgeProps {
  recordId: string;
  className?: string;
}

export function ReminderBadge({ recordId, className }: ReminderBadgeProps) {
  const [reminderCount, setReminderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReminderCount = async () => {
      try {
        const { count, error } = await supabase
          .from('reminders')
          .select('*', { count: 'exact', head: true })
          .eq('record_id', recordId)
          .eq('is_active', true);

        if (error) throw error;
        setReminderCount(count || 0);
      } catch (error) {
        console.error('Error fetching reminder count:', error);
        setReminderCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReminderCount();
  }, [recordId]);

  if (isLoading) {
    return null;
  }

  if (reminderCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="secondary" 
      className={`bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 ${className}`}
    >
      <Bell className="h-3 w-3 mr-1" />
      {reminderCount}
    </Badge>
  );
}
