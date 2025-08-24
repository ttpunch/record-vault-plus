import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Bell, FileText, AlertTriangle, CheckCircle, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format, addDays, addWeeks, addMonths, isToday, isTomorrow, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface FollowUpItem {
  id: string;
  type: 'reminder' | 'overdue';
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'overdue' | 'completed';
  record_id?: string;
  reminder_id?: string;
}

interface FollowUpDashboardProps {
  className?: string;
}

export const FollowUpDashboard: React.FC<FollowUpDashboardProps> = ({ className }) => {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      
      // Fetch active reminders
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select(`
          id,
          title,
          description,
          reminder_date,
          reminder_time,
          time_limit,
          is_active,
          record_id,
          records!inner(record_title:title)
        `)
        .eq('is_active', true)
        .gte('reminder_date', new Date().toISOString().split('T')[0])
        .order('reminder_date', { ascending: true })
        .order('reminder_time', { ascending: true });

      if (remindersError) {
        if (remindersError.message.includes('relation "reminders" does not exist')) {
          toast({
            title: "Follow-ups Not Available",
            description: "The reminders feature hasn't been set up yet.",
            variant: "destructive",
          });
          setFollowUps([]);
          return;
        }
        throw remindersError;
      }

      // Transform reminders into follow-up items
      const followUpItems: FollowUpItem[] = (reminders || []).map(reminder => {
        const dueDate = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
        const now = new Date();
        const isOverdue = dueDate < now;
        
        return {
          id: reminder.id,
          type: isOverdue ? 'overdue' : 'reminder',
          title: reminder.title,
          description: reminder.description || `Reminder for: ${reminder.records.record_title}`,
          due_date: dueDate.toISOString(),
          priority: getPriorityFromTimeLimit(reminder.time_limit),
          status: isOverdue ? 'overdue' : 'pending',
          record_id: reminder.record_id,
          reminder_id: reminder.id,
        };
      });

      setFollowUps(followUpItems);
    } catch (error: any) {
      console.error('Error fetching follow-ups:', error);
      const errorMessage = error.message || "An unknown error occurred.";
      toast({
        title: "Error Loading Follow-ups",
        description: `Failed to load follow-ups: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityFromTimeLimit = (timeLimit: string): 'low' | 'medium' | 'high' => {
    if (timeLimit.includes('5 minutes') || timeLimit.includes('15 minutes')) {
      return 'high';
    } else if (timeLimit.includes('30 minutes') || timeLimit.includes('1 hour')) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const getFollowUpsByPeriod = (period: string) => {
    const now = new Date();
    
    return followUps.filter(item => {
      const dueDate = new Date(item.due_date);
      
      switch (period) {
        case 'today':
          return isToday(dueDate);
        case 'tomorrow':
          return isTomorrow(dueDate);
        case 'this-week':
          return isThisWeek(dueDate) && !isToday(dueDate) && !isTomorrow(dueDate);
        case 'this-month':
          return isThisMonth(dueDate) && !isThisWeek(dueDate);
        case 'overdue':
          return item.status === 'overdue';
        default:
          return true;
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDueDate = (dueDate: string) => {
    try {
      const date = new Date(dueDate);
      if (isToday(date)) {
        return `Today at ${format(date, 'HH:mm')}`;
      } else if (isTomorrow(date)) {
        return `Tomorrow at ${format(date, 'HH:mm')}`;
      } else {
        return format(date, 'MMM dd, yyyy HH:mm');
      }
    } catch {
      return dueDate;
    }
  };

  const handleViewRecord = (recordId: string) => {
    // Navigate to the record or open it in a modal
    navigate(`/dashboard?record=${recordId}`);
  };

  const handleMarkComplete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: false })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Follow-up completed",
        description: "The follow-up has been marked as complete.",
      });

      fetchFollowUps(); // Refresh the list
    } catch (error) {
      console.error('Error marking follow-up complete:', error);
      toast({
        title: "Error",
        description: "Failed to mark follow-up as complete.",
        variant: "destructive",
      });
    }
  };

  const getTabCount = (period: string) => {
    return getFollowUpsByPeriod(period).length;
  };

  return (
    <div className={`bg-gradient-to-br from-background via-background to-muted/20 rounded-xl border border-border/60 backdrop-blur-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Follow-ups</h2>
              <p className="text-sm text-muted-foreground">Track your tasks and reminders</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchFollowUps}
            disabled={loading}
            className="h-9 px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 bg-muted/50 h-11">
            {[
              { value: 'today', label: 'Today' },
              { value: 'tomorrow', label: 'Tomorrow' },
              { value: 'this-week', label: 'Week' },
              { value: 'this-month', label: 'Month' },
              { value: 'overdue', label: 'Overdue', variant: 'destructive' as const },
              { value: 'all', label: 'All' }
            ].map(({ value, label, variant }) => (
              <TabsTrigger key={value} value={value} className="text-xs font-medium">
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.slice(0, 3)}</span>
                {getTabCount(value) > 0 && (
                  <Badge 
                    variant={variant || "secondary"} 
                    className="ml-1 h-4 w-4 p-0 text-xs rounded-full"
                  >
                    {getTabCount(value)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {['today', 'tomorrow', 'this-week', 'this-month', 'overdue', 'all'].map((period) => (
            <TabsContent key={period} value={period} className="mt-4">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  </div>
                ) : getFollowUpsByPeriod(period).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-3 bg-muted/30 rounded-full w-fit mx-auto mb-3">
                      <Bell className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No {period.replace('-', ' ')} follow-ups</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFollowUpsByPeriod(period).map((item) => (
                      <div key={item.id} className="group relative bg-card/50 border border-border/40 rounded-lg p-4 hover:bg-card hover:border-border transition-all duration-200 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="mt-0.5">
                              {getStatusIcon(item.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{item.title}</h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs h-5 ${getPriorityColor(item.priority)} border-0`}
                                >
                                  {item.priority}
                                </Badge>
                                {item.status === 'overdue' && (
                                  <Badge variant="destructive" className="text-xs h-5">
                                    Overdue
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDueDate(item.due_date)}</span>
                                </div>
                                {item.type === 'reminder' && (
                                  <div className="flex items-center gap-1">
                                    <Bell className="h-3 w-3" />
                                    <span>Reminder</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.record_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewRecord(item.record_id!)}
                                className="h-8 w-8 p-0"
                              >
                                <FileText className="h-3 w-3" />
                              </Button>
                            )}
                            {item.status !== 'completed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkComplete(item.id)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};
