import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchSummaryProps {
  totalRecords: number;
  filteredRecords: number;
  searchQuery: string;
  hasFilters: boolean;
  onClearSearch: () => void;
}

export function SearchSummary({ 
  totalRecords, 
  filteredRecords, 
  searchQuery, 
  hasFilters, 
  onClearSearch 
}: SearchSummaryProps) {
  if (!searchQuery && !hasFilters) return null;

  const isFiltered = searchQuery || hasFilters;
  const matchPercentage = totalRecords > 0 ? Math.round((filteredRecords / totalRecords) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="font-medium text-foreground">
              Search Results
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredRecords} of {totalRecords} records found
              {isFiltered && (
                <span className="ml-2 text-purple-600 dark:text-purple-400 font-medium">
                  ({matchPercentage}% match)
                </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              "{searchQuery}"
              <button
                onClick={onClearSearch}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {hasFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSearch}
            >
              <X className="h-4 w-4 mr-1" />
              Clear Search
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
