import { useState, useEffect } from 'react';
import { Shield, Download, Filter, Trash2 } from 'lucide-react';
import { AuditLogger, type AuditEvent } from '../../lib/security/audit-logger';

export const AuditLog = () => {
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: '',
    action: '',
    days: 7
  });
  const [auditLogger] = useState(() => new AuditLogger());

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [logs, filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await auditLogger.getLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let filtered = [...logs];

    if (filter.type) {
      filtered = filtered.filter(log => log.type === filter.type);
    }

    if (filter.action) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(filter.action.toLowerCase())
      );
    }

    if (filter.days > 0) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - filter.days);
      filtered = filtered.filter(log => log.timestamp >= cutoff);
    }

    setFilteredLogs(filtered);
  };

  const exportLogs = async () => {
    try {
      const data = await auditLogger.exportLogs();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const clearLogs = async () => {
    if (confirm('Are you sure you want to clear all audit logs?')) {
      await auditLogger.clearLogs();
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  const getTypeColor = (type: AuditEvent['type']) => {
    const colors = {
      user_action: 'bg-blue-100 text-blue-700',
      data_access: 'bg-green-100 text-green-700',
      settings_change: 'bg-orange-100 text-orange-700',
      security_event: 'bg-red-100 text-red-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="user_action">User Action</option>
              <option value="data_access">Data Access</option>
              <option value="settings_change">Settings Change</option>
              <option value="security_event">Security Event</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <input
              type="text"
              value={filter.action}
              onChange={(e) => setFilter(prev => ({ ...prev, action: e.target.value }))}
              placeholder="Search actions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Days</label>
            <select
              value={filter.days}
              onChange={(e) => setFilter(prev => ({ ...prev, days: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={0}>All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {filteredLogs.length} events
            </span>
            <span className="text-sm text-gray-500">
              Total: {logs.length} events
            </span>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No audit events found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(log.type)}`}>
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="font-medium text-gray-900">{log.action}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {log.timestamp.toLocaleString()}
                      </div>
                      
                      {Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};