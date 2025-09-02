import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const TableSkeleton = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-48"></div>
          <div className="flex items-center gap-2">
            <div className="h-8 bg-muted rounded w-32"></div>
            <div className="h-8 bg-muted rounded w-8"></div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Table header skeleton */}
          <div className="grid grid-cols-12 gap-4 py-3 border-b">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
          
          {/* Table rows skeleton */}
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-12 gap-4 py-3 border-b">
              {Array.from({ length: 12 }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-muted rounded"></div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
