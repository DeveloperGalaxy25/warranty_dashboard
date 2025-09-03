import { Card, CardContent } from "@/components/ui/card";

export const KpiSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="border-border/50 animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-16"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

