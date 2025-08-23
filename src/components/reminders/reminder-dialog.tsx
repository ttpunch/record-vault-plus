import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReminderForm } from "./reminder-form";
import { ReminderList } from "./reminder-list";

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

interface ReminderDialogProps {
  recordId: string;
  recordTitle: string;
  trigger?: React.ReactNode;
}

export function ReminderDialog({ recordId, recordTitle, trigger }: ReminderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  const fetchReminders = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      // First, check if the reminders table exists by doing a simple query
      const { data, error } = await supabase
        .from('reminders')
        .select('id')
        .eq('record_id', recordId)
        .limit(1);

      if (error) {
        console.error('Error checking reminders table:', error);
        // If it's a table doesn't exist error, show a helpful message
        if (error.message.includes('relation "reminders" does not exist')) {
          toast({
            title: "Reminders not available",
            description: "The reminders feature is not set up yet. Please contact support.",
            variant: "destructive",
          });
          setHasError(true);
          return;
        }
        // For other errors, just set empty array
        setReminders([]);
        return;
      }

      // If table exists, fetch all reminders
      const { data: allReminders, error: fetchError } = await supabase
        .from('reminders')
        .select('*')
        .eq('record_id', recordId)
        .order('reminder_date', { ascending: true });

      if (fetchError) {
        console.error('Error fetching reminders:', fetchError);
        setReminders([]);
        return;
      }
      
      setReminders(allReminders || []);
    } catch (error) {
      console.error('Unexpected error fetching reminders:', error);
      setReminders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
    }
  }, [isOpen, recordId]);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingReminder(null);
    fetchReminders();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleReminderDeleted = () => {
    fetchReminders();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Reminders
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Reminders for "{recordTitle}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {hasError ? 'Reminders unavailable' : `${reminders.length} reminder${reminders.length !== 1 ? 's' : ''} set`}
            </div>
            <div className="flex gap-2">
              {!showForm && !hasError && (
                <Button
                  onClick={() => setShowForm(true)}
                  variant="gradient"
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              )}
              {showForm && (
                <Button
                  onClick={handleFormCancel}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Error State */}
          {hasError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">Reminders Not Available</h4>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    The reminders feature is not set up yet. Please run the database migrations or contact support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reminder Form */}
          {showForm && !hasError && (
            <ReminderForm
              recordId={recordId}
              recordTitle={recordTitle}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={editingReminder ? {
                id: editingReminder.id,
                title: editingReminder.title,
                description: editingReminder.description,
                reminder_date: editingReminder.reminder_date,
                reminder_time: editingReminder.reminder_time,
                time_limit: editingReminder.time_limit,
                actions: editingReminder.actions,
                is_active: editingReminder.is_active,
              } : undefined}
            />
          )}

          {/* Reminders List */}
          {!showForm && !hasError && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading reminders...</p>
                  </div>
                </div>
              ) : (
                <ReminderList
                  reminders={reminders}
                  onEdit={handleEdit}
                  onReminderDeleted={handleReminderDeleted}
                />
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
