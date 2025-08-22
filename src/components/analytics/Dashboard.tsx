import { useState, useEffect } from 'react';
import { BarChart3, Clock, Zap, Calendar } from 'lucide-react';
import { UsageTracker, type UsageStats } from '../../lib/analytics/usage-tracker';

export const Dashboard = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracker] = useState(() => new UsageTracker());

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const usageStats = tracker.getUsageStats();
    setStats(usageStats);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Usage Dashboard</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Sessions</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalSessions}</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Commands</span>
          </div>
          <div className="text-2xl font-bold text-green-900">{stats.totalCommands}</div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Avg Session</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {Math.round(stats.averageSessionDuration / 60)}m
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Features</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{stats.mostUsedFeatures.length}</div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Most Used Features</h3>
        {stats.mostUsedFeatures.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No feature usage data yet</p>
        ) : (
          <div className="space-y-3">
            {stats.mostUsedFeatures.slice(0, 5).map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {feature.feature.replace(':', ' → ')}
                </span>
                <span className="text-sm text-gray-600">{feature.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};