import { format } from "date-fns";

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

interface SearchFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function searchRecords(records: Record[], query: string, filters: SearchFilters): Record[] {
  let filteredRecords = [...records];

  // Text search across title, description, and category
  if (query.trim()) {
    const searchTerm = query.toLowerCase().trim();
    filteredRecords = filteredRecords.filter(record => {
      const titleMatch = record.title.toLowerCase().includes(searchTerm);
      const descriptionMatch = record.description?.toLowerCase().includes(searchTerm) || false;
      const categoryMatch = record.category?.toLowerCase().includes(searchTerm) || false;
      
      // Date search - check if query matches date format
      const dateMatch = format(new Date(record.event_date), 'MMM dd, yyyy').toLowerCase().includes(searchTerm) ||
                       format(new Date(record.event_date), 'yyyy-MM-dd').includes(searchTerm) ||
                       format(new Date(record.event_date), 'MM/dd/yyyy').includes(searchTerm);

      return titleMatch || descriptionMatch || categoryMatch || dateMatch;
    });
  }

  // Category filter
  if (filters.category) {
    filteredRecords = filteredRecords.filter(record => 
      record.category === filters.category
    );
  }

  // Date range filters
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filteredRecords = filteredRecords.filter(record => 
      new Date(record.event_date) >= fromDate
    );
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999); // Include the entire day
    filteredRecords = filteredRecords.filter(record => 
      new Date(record.event_date) <= toDate
    );
  }

  return filteredRecords;
}

export function getUniqueCategories(records: Record[]): string[] {
  const categories = records
    .map(record => record.category)
    .filter(Boolean) as string[];
  
  return [...new Set(categories)].sort();
}
