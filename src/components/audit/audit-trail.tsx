import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, User, FileText, Bell, Filter, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type AuditTrail = Database['public']['Tables']['audit_trail']['Row'];

interface AuditTrailProps {
  recordId?: string;
  className?: string;
  trigger?: React.ReactNode;
}

export const AuditTrailComponent: React.FC<AuditTrailProps> = ({ recordId, className, trigger }) => {
  const [auditEntries, setAuditEntries] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('audit_trail')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (recordId) {
        query = query.eq('record_id', recordId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit trail:', error);
        toast({
          title: "Error Loading Audit Trail",
          description: "Failed to load audit trail data.",
          variant: "destructive",
        });
        setAuditEntries([]);
        return;
      }

      setAuditEntries(data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast({
        title: "Error",
        description: "Failed to load audit trail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [recordId]);

  const filteredEntries = auditEntries.filter(entry => {
    const matchesFilter = filter === 'all' || entry.action === filter;
    const matchesSearch = searchQuery === '' || 
      entry.table_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'UPDATE':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'DELETE':
        return <FileText className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'records':
        return <FileText className="h-4 w-4" />;
      case 'reminders':
        return <Bell className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
    } catch {
      return timestamp;
    }
  };

  const getChangedFieldsText = (changedFields: string[]) => {
    if (!changedFields || changedFields.length === 0) return '';
    return changedFields.join(', ');
  };

  const content = (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Track all changes made to your records and reminders
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditTrail}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">Created</SelectItem>
              <SelectItem value="UPDATE">Updated</SelectItem>
              <SelectItem value="DELETE">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit Entries */}
        <ScrollArea className="h-96">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-500" />
              <span className="ml-2">Loading audit trail...</span>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit entries found</p>
              {recordId && <p className="text-sm">No changes have been made to this record yet.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(entry.action)}
                      <div className="flex items-center gap-2">
                        {getTableIcon(entry.table_name)}
                        <span className="font-medium capitalize">{entry.table_name}</span>
                      </div>
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>
                  
                  {entry.changed_fields && entry.changed_fields.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Changed fields: <span className="font-medium">{getChangedFieldsText(entry.changed_fields)}</span>
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>User: {entry.user_id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Record ID: {entry.record_id.slice(0, 8)}...</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  if (trigger) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Audit Trail</DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden">
            {content}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return content;
};
