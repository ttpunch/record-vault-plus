import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Calendar, FileText, Bell, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ReminderDialog } from "@/components/reminders/reminder-dialog";
import { ReminderBadge } from "@/components/reminders/reminder-badge";
import { AuditTrailComponent } from "@/components/audit/audit-trail";
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

import type { Record } from "@/types/records";

interface RecordListProps {
  records: Record[];
  onEdit: (record: Record) => void;
  onRecordDeleted: () => void;
}

export function RecordList({ records, onEdit, onRecordDeleted }: RecordListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Record deleted",
        description: "The record has been successfully deleted.",
      });
      
      onRecordDeleted();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (records.length === 0) {
    return (
      <Card className="bg-gradient-card shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No records found. Create your first record to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <Card 
          key={record.id} 
          className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border border-purple-100 dark:border-purple-800"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {record.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(record.event_date), 'MMM dd, yyyy')}
                  </div>
                  {record.categories?.name && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {record.categories.name}
                    </Badge>
                  )}
                  <ReminderBadge recordId={record.id} />
                </div>
              </div>
              <div className="flex gap-2">
                <ReminderDialog
                  recordId={record.id}
                  recordTitle={record.title}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900"
                    >
                      <Bell className="h-4 w-4" />
                    </Button>
                  }
                />
                <AuditTrailComponent
                  recordId={record.id}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900"
                      title="View History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(record)}
                  className="hover:bg-primary-light hover:text-primary"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === record.id}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Record</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{record.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(record.id)}
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
          {(record.description || record.notes) && (
            <CardContent className="pt-0">
              {record.description && (
                <div 
                  className="prose dark:prose-invert max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: record.description }}
                />
              )}
              {record.notes && (
                <div className="mt-4">
                  <h4 className="font-semibold text-sm text-foreground">Notes</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}