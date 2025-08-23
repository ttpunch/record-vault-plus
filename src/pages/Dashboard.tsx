import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Download, LogOut, User, Loader2 } from "lucide-react";
import { StatsOverview } from "@/components/dashboard/stats-overview";
import { RecordForm } from "@/components/records/record-form";
import { RecordList } from "@/components/records/record-list";
import { SearchBar } from "@/components/search/search-bar";
import { SearchSummary } from "@/components/search/search-summary";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PurpleGradientCard } from "@/components/ui/purple-gradient-card";
import { searchRecords, getUniqueCategories } from "@/lib/search";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { reminderService } from "@/services/reminder-service";
import { FollowUpDashboard } from "@/components/follow-up/follow-up-dashboard";

interface Record {
  id: string;
  title: string;
  description?: string;
  category?: string;
  event_date: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function Dashboard() {
  const [records, setRecords] = useState<Record[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Record | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState({});
  const { toast } = useToast();
  const { user, signOut } = useAuth();

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
    
    // Start reminder service when dashboard loads
    reminderService.startReminderChecks();
    
    // Cleanup reminder service when component unmounts
    return () => {
      reminderService.stopReminderChecks();
    };
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
    const recordsToExport = searchQuery || Object.keys(searchFilters).length > 0 ? filteredRecords : records;
    const fileName = searchQuery || Object.keys(searchFilters).length > 0 ? 'filtered_records.csv' : 'all_records.csv';
    
    const csvContent = [
      ['Title', 'Category', 'Event Date', 'Description'],
      ...recordsToExport.map(record => [
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
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `${recordsToExport.length} records have been exported to CSV.`,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (query: string, filters: any) => {
    setSearchQuery(query);
    setSearchFilters(filters);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchFilters({});
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSearchFocus: () => (window as any).focusSearch?.(),
    onClearSearch: handleClearSearch,
  });

  // Get unique categories for search filters
  const categories = useMemo(() => getUniqueCategories(records), [records]);

  // Filter records based on search
  const filteredRecords = useMemo(() => {
    return searchRecords(records, searchQuery, searchFilters);
  }, [records, searchQuery, searchFilters]);

  // Calculate statistics based on filtered records
  const now = new Date();
  const thisMonth = filteredRecords.filter(record => {
    const recordDate = new Date(record.event_date);
    return recordDate.getMonth() === now.getMonth() && 
           recordDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeek = filteredRecords.filter(record => {
    const recordDate = new Date(record.event_date);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return recordDate >= weekAgo;
  }).length;

  const categoryCount = new Set(filteredRecords.map(r => r.category).filter(Boolean)).size;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-purple-950 dark:via-gray-900 dark:to-purple-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600 dark:text-purple-400" />
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
              <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
                Data Recorder
              </h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your important events and milestones
              </p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredRecords.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export {searchQuery || Object.keys(searchFilters).length > 0 ? 'Filtered' : 'All'}
              </Button>
              <Button
                variant="gradient"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.user_metadata?.username || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <PurpleGradientCard variant="subtle" className="mb-6 p-4">
          <SearchBar
            onSearch={handleSearch}
            onClearSearch={handleClearSearch}
            categories={categories}
            isLoading={isLoading}
          />
        </PurpleGradientCard>

        {/* Search Summary */}
        <SearchSummary
          totalRecords={records.length}
          filteredRecords={filteredRecords.length}
          searchQuery={searchQuery}
          hasFilters={Object.keys(searchFilters).length > 0}
          onClearSearch={handleClearSearch}
        />

        {/* Statistics Overview */}
        <div className="mb-8">
          <StatsOverview
            totalRecords={filteredRecords.length}
            thisMonth={thisMonth}
            thisWeek={thisWeek}
            categories={categoryCount}
          />
        </div>

        {/* Follow-up Dashboard */}
        <div className="mb-8">
          <FollowUpDashboard />
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
                created_by: editingRecord.created_by,
              } : undefined}
            />
          </div>
        )}

        {/* Records List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-foreground">
              {searchQuery || Object.keys(searchFilters).length > 0 ? 'Search Results' : 'Recent Records'}
            </h2>
            {(searchQuery || Object.keys(searchFilters).length > 0) && (
              <span className="text-sm text-muted-foreground">
                {filteredRecords.length} of {records.length} records
              </span>
            )}
          </div>
          <RecordList
            records={filteredRecords}
            onEdit={handleEdit}
            onRecordDeleted={fetchRecords}
          />
        </div>
      </div>
    </div>
  );
}