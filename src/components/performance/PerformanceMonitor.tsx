"use client";

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  loadTime: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    loadTime: 0,
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Measure load time
    const startTime = performance.now();
    
    // Measure when component is ready
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration,
          }));
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    // Measure memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
      }));
    }
    
    // Calculate load time
    const loadTime = performance.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      loadTime,
    }));
    
    return () => observer.disconnect();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium shadow-lg hover:bg-primary/90 transition-colors"
      >
        📊 Perf
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-card border border-border rounded-lg p-4 shadow-xl min-w-[250px]">
          <h3 className="font-semibold text-card-foreground mb-3">Performance Metrics</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Render Time:</span>
              <span className="font-mono">{metrics.renderTime.toFixed(2)}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Load Time:</span>
              <span className="font-mono">{metrics.loadTime.toFixed(2)}ms</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Memory Usage:</span>
              <span className="font-mono">{metrics.memoryUsage.toFixed(2)}MB</span>
            </div>
            
            <div className="pt-2 border-t border-border">
              <div className="text-xs text-muted-foreground">
                💡 Tips for better performance:
              </div>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                <li>• Use next/dynamic for code splitting</li>
                <li>• Optimize images with next/image</li>
                <li>• Use React.memo for expensive components</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;

