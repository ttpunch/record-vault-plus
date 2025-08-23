import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Calendar, Clock, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReminderFormProps {
  recordId: string;
  recordTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    reminder_date: string;
    reminder_time: string;
    time_limit: string;
    actions: string[];
    is_active: boolean;
  };
}

const REMINDER_ACTIONS = [
  "Send email notification",
  "Show browser notification",
  "Send SMS (if configured)",
  "Add to calendar",
  "Create follow-up task",
  "Send Slack notification",
  "Create meeting reminder",
  "Send WhatsApp message"
];

const TIME_LIMITS = [
  { value: "5min", label: "5 minutes before" },
  { value: "15min", label: "15 minutes before" },
  { value: "30min", label: "30 minutes before" },
  { value: "1hour", label: "1 hour before" },
  { value: "2hours", label: "2 hours before" },
  { value: "1day", label: "1 day before" },
  { value: "2days", label: "2 days before" },
  { value: "1week", label: "1 week before" },
  { value: "custom", label: "Custom time" }
];

export function ReminderForm({ 
  recordId, 
  recordTitle, 
  onSuccess, 
  onCancel, 
  initialData 
}: ReminderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || `Reminder: ${recordTitle}`,
    description: initialData?.description || "",
    reminder_date: initialData?.reminder_date || new Date().toISOString().split('T')[0],
    reminder_time: initialData?.reminder_time || "09:00",
    time_limit: initialData?.time_limit || "1hour",
    custom_time_limit: "",
    actions: initialData?.actions || ["Show browser notification"],
    is_active: initialData?.is_active ?? true,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const reminderData = {
        record_id: recordId,
        title: formData.title,
        description: formData.description,
        reminder_date: formData.reminder_date,
        reminder_time: formData.reminder_time,
        time_limit: formData.time_limit === "custom" ? formData.custom_time_limit : formData.time_limit,
        actions: formData.actions,
        is_active: formData.is_active,
      };

      if (initialData?.id) {
        // Update existing reminder
        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', initialData.id);

        if (error) {
          console.error('Supabase error:', error);
          if (error.message.includes('relation "reminders" does not exist')) {
            toast({
              title: "Database Setup Required",
              description: "The reminders table doesn't exist. Please run the database setup first.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }
        
        toast({
          title: "Reminder updated",
          description: "Your reminder has been successfully updated.",
        });
      } else {
        // Create new reminder
        const { error } = await supabase
          .from('reminders')
          .insert([reminderData]);

        if (error) {
          console.error('Supabase error:', error);
          if (error.message.includes('relation "reminders" does not exist')) {
            toast({
              title: "Database Setup Required",
              description: "The reminders table doesn't exist. Please run the database setup first.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
          return;
        }
        
        toast({
          title: "Reminder created",
          description: "Your reminder has been successfully created.",
        });
      }

      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving reminder:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionToggle = (action: string) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action]
    }));
  };

  return (
    <Card className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-lg border border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          {initialData?.id ? "Edit Reminder" : "Set Reminder"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Reminder Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter reminder title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter reminder description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_date">Reminder Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reminder_date"
                  type="date"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_date: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_time">Reminder Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reminder_time"
                  type="time"
                  value={formData.reminder_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_limit">Time Limit</Label>
            <Select
              value={formData.time_limit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, time_limit: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time limit" />
              </SelectTrigger>
              <SelectContent>
                {TIME_LIMITS.map((limit) => (
                  <SelectItem key={limit.value} value={limit.value}>
                    {limit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.time_limit === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom_time_limit">Custom Time Limit</Label>
              <Input
                id="custom_time_limit"
                value={formData.custom_time_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, custom_time_limit: e.target.value }))}
                placeholder="e.g., 45min, 3hours, 2days"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Reminder Actions</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {REMINDER_ACTIONS.map((action) => (
                <div key={action} className="flex items-center space-x-2">
                  <Checkbox
                    id={action}
                    checked={formData.actions.includes(action)}
                    onCheckedChange={() => handleActionToggle(action)}
                  />
                  <Label htmlFor={action} className="text-sm font-normal">
                    {action}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, is_active: checked as boolean }))
              }
            />
            <Label htmlFor="is_active" className="text-sm font-normal">
              Active reminder
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              variant="gradient"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : "Save Reminder"}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
