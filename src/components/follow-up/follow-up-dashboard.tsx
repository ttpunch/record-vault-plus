import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Bell, FileText, AlertTriangle, CheckCircle, ArrowRight, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FollowUpItem } from '@/integrations/supabase/types';
import { format, addDays, addWeeks, addMonths, isToday, isTomorrow, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Follow-up Dashboard
            </CardTitle>
            <CardDescription>
              Track your upcoming tasks, reminders, and follow-ups
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFollowUps}
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="today" className="flex items-center gap-1">
              Today
              {getTabCount('today') > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {getTabCount('today')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="flex items-center gap-1">
              Tomorrow
              {getTabCount('tomorrow') > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {getTabCount('tomorrow')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="this-week" className="flex items-center gap-1">
              This Week
              {getTabCount('this-week') > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {getTabCount('this-week')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="this-month" className="flex items-center gap-1">
              This Month
              {getTabCount('this-month') > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {getTabCount('this-month')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-1">
              Overdue
              {getTabCount('overdue') > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {getTabCount('overdue')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-1">
              All
              {followUps.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                  {followUps.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {['today', 'tomorrow', 'this-week', 'this-month', 'overdue', 'all'].map((period) => (
            <TabsContent key={period} value={period} className="mt-4">
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-6 w-6 animate-spin text-purple-500" />
                    <span className="ml-2">Loading follow-ups...</span>
                  </div>
                ) : getFollowUpsByPeriod(period).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No follow-ups for {period.replace('-', ' ')}</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getFollowUpsByPeriod(period).map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(item.status)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{item.title}</h4>
                                <Badge className={getPriorityColor(item.priority)}>
                                  {item.priority}
                                </Badge>
                                {item.status === 'overdue' && (
                                  <Badge variant="destructive">Overdue</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDueDate(item.due_date)}</span>
                                </div>
                                {item.type === 'reminder' && (
                                  <div className="flex items-center gap-1">
                                    <Bell className="h-4 w-4" />
                                    <span>Reminder</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.record_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRecord(item.record_id!)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                            {item.status !== 'completed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkComplete(item.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
