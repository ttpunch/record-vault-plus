import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecordForm } from "@/components/records/record-form";
import { RecordList } from "@/components/records/record-list";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Record {
  id: string;
  title: string;
  description?: string;
  category?: string;
  event_date: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const { toast } = useToast();

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to load records. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchRecords();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleEdit = (record: Record) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleExport = () => {
    const csvContent = [
      ['Title', 'Category', 'Event Date', 'Description'],
      ...records.map(record => [
        record.title,
        record.category || '',
        record.event_date,
        record.description || ''
      ])
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'records.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: "Your records have been exported to CSV.",
    });
  };

  // Calculate statistics
  const now = new Date();
  const thisMonth = records.filter(record => {
    const recordDate = new Date(record.event_date);
    return recordDate.getMonth() === now.getMonth() && 
           recordDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeek = records.filter(record => {
    const recordDate = new Date(record.event_date);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return recordDate >= weekAgo;
  }).length;

  const categories = new Set(records.map(r => r.category).filter(Boolean)).size;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
                Data Recorder
              </h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your important events and milestones
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={records.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="gradient"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Overview */}
        <div className="mb-8">
          <StatsOverview
            totalRecords={records.length}
            thisMonth={thisMonth}
            thisWeek={thisWeek}
            categories={categories}
          />
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-8">
            <RecordForm
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={editingRecord ? {
                id: editingRecord.id,
                title: editingRecord.title,
                description: editingRecord.description,
                category: editingRecord.category,
                event_date: editingRecord.event_date,
              } : undefined}
            />
          </div>
        )}

        {/* Records List */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Recent Records
          </h2>
          <RecordList
            records={records}
            onEdit={handleEdit}
            onRecordDeleted={fetchRecords}
          />
        </div>
      </div>
    </div>
  );
}