import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Edit2, Trash2, Clock, Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time: string;
  time_limit: string;
  actions: string[];
  is_active: boolean;
  created_at: string;
}

interface ReminderListProps {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onReminderDeleted: () => void;
}

export function ReminderList({ reminders, onEdit, onReminderDeleted }: ReminderListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "The reminder has been successfully deleted.",
      });
      
      onReminderDeleted();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (reminder: Reminder) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: !reminder.is_active })
        .eq('id', reminder.id);

      if (error) throw error;

      toast({
        title: reminder.is_active ? "Reminder deactivated" : "Reminder activated",
        description: `Reminder has been ${reminder.is_active ? 'deactivated' : 'activated'}.`,
      });
      
      onReminderDeleted(); // Refresh the list
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTimeLimitLabel = (timeLimit: string) => {
    const timeMap: { [key: string]: string } = {
      "5min": "5 minutes before",
      "15min": "15 minutes before",
      "30min": "30 minutes before",
      "1hour": "1 hour before",
      "2hours": "2 hours before",
      "1day": "1 day before",
      "2days": "2 days before",
      "1week": "1 week before"
    };
    return timeMap[timeLimit] || timeLimit;
  };

  const getStatusColor = (reminder: Reminder) => {
    const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
    const now = new Date();
    
    if (!reminder.is_active) return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    if (reminderDateTime < now) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (reminderDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getStatusText = (reminder: Reminder) => {
    if (!reminder.is_active) return "Inactive";
    
    const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
    const now = new Date();
    
    if (reminderDateTime < now) return "Overdue";
    if (reminderDateTime.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return "Today";
    return "Upcoming";
  };

  if (reminders.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-lg border border-purple-200 dark:border-purple-800">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center mb-2">
            No reminders set for this record yet.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Click "Add Reminder" to create your first reminder.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {reminders.map((reminder) => (
        <Card 
          key={reminder.id} 
          className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-purple-100 dark:border-purple-800"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {reminder.title}
                  </CardTitle>
                  <Badge className={getStatusColor(reminder)}>
                    {getStatusText(reminder)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(reminder.reminder_date), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {reminder.reminder_time}
                  </div>
                  <div className="text-xs">
                    {getTimeLimitLabel(reminder.time_limit)}
                  </div>
                </div>

                {reminder.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {reminder.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  {reminder.actions.slice(0, 3).map((action, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {action}
                    </Badge>
                  ))}
                  {reminder.actions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{reminder.actions.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleActive(reminder)}
                  className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900"
                >
                  {reminder.is_active ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(reminder)}
                  className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === reminder.id}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Reminder</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{reminder.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(reminder.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
