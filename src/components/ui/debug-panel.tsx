
import React, { useState, useEffect } from 'react';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, Bug, Activity, AlertTriangle } from 'lucide-react';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(performanceMonitoringService.getMetrics());
  const [errors, setErrors] = useState(performanceMonitoringService.getErrors());
  const [summary, setSummary] = useState(performanceMonitoringService.getMetricsSummary());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitoringService.getMetrics());
      setErrors(performanceMonitoringService.getErrors());
      setSummary(performanceMonitoringService.getMetricsSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleDebug = () => {
    const newDebugMode = !performanceMonitoringService.getDebugMode();
    performanceMonitoringService.setDebugMode(newDebugMode);
  };

  const handleExportData = () => {
    const data = performanceMonitoringService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearMetrics = () => {
    performanceMonitoringService.clearMetrics();
    setMetrics([]);
    setSummary({});
  };

  const handleClearErrors = () => {
    performanceMonitoringService.clearErrors();
    setErrors([]);
  };

  if (!performanceMonitoringService.getDebugMode()) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
        >
          <Bug className="h-4 w-4 mr-1" />
          Debug
        </Button>
        
        {isOpen && (
          <Card className="absolute bottom-12 right-0 w-80 shadow-lg">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                Debug mode is disabled. Enable it to see performance metrics and error tracking.
              </p>
              <Button onClick={handleToggleDebug} size="sm" className="w-full">
                Enable Debug Mode
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-50 border-blue-200 hover:bg-blue-100"
      >
        <Bug className="h-4 w-4 mr-1" />
        Debug Panel
        {errors.length > 0 && (
          <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
            {errors.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute bottom-12 right-0 w-96 h-96 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Monitor
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={handleToggleDebug}>
                  Disable
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  ×
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-0">
            <Tabs defaultValue="metrics" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="errors">
                  Errors
                  {errors.length > 0 && (
                    <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                      {errors.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="h-80 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {Object.entries(summary).map(([name, data]) => (
                      <div key={name} className="p-3 bg-gray-50 rounded-lg">
                        <div className="font-medium text-sm truncate">{name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          <div>Count: {data.count}</div>
                          <div>Avg: {data.average.toFixed(2)}ms</div>
                          <div>Min: {data.min.toFixed(2)}ms</div>
                          <div>Max: {data.max.toFixed(2)}ms</div>
                        </div>
                      </div>
                    ))}
                    {Object.keys(summary).length === 0 && (
                      <div className="text-center text-gray-500 text-sm">
                        No metrics recorded yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="errors" className="h-80 p-4">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {errors.slice(-10).reverse().map((error, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-red-800 truncate">
                              {error.context}
                            </div>
                            <div className="text-xs text-red-600 mt-1 break-all">
                              {error.error.message}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(error.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {errors.length === 0 && (
                      <div className="text-center text-gray-500 text-sm">
                        No errors recorded
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="actions" className="h-80 p-4">
                <div className="space-y-3">
                  <Button onClick={handleExportData} className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Performance Data
                  </Button>
                  
                  <Button onClick={handleClearMetrics} className="w-full justify-start" variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Metrics ({metrics.length})
                  </Button>
                  
                  <Button onClick={handleClearErrors} className="w-full justify-start" variant="outline">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Errors ({errors.length})
                  </Button>

                  <div className="pt-3 border-t">
                    <div className="text-xs text-gray-600">
                      <div>Total Metrics: {metrics.length}</div>
                      <div>Total Errors: {errors.length}</div>
                      <div>Debug Mode: Enabled</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
