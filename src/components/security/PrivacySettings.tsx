import { useState, useEffect } from 'react';
import { Shield, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { PrivacyManager, type PrivacySettings, type DataCategory } from '../../lib/security/privacy-manager';

export const PrivacySettingsComponent = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [categories, setCategories] = useState<DataCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [privacyManager] = useState(() => new PrivacyManager());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [privacySettings, dataCategories] = await Promise.all([
        privacyManager.getSettings(),
        privacyManager.getDataCategories()
      ]);
      setSettings(privacySettings);
      setCategories(dataCategories);
    } catch (error) {
      console.error('Failed to load privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    if (!settings) return;
    
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await privacyManager.updateSettings({ [key]: value });
  };

  const exportData = async () => {
    try {
      const data = await privacyManager.exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `browsereye-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data: ' + (error as Error).message);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (confirm('Are you sure you want to delete all data in this category?')) {
      await privacyManager.deleteDataByCategory(categoryId);
      alert('Data deleted successfully');
    }
  };

  const cleanupOldData = async () => {
    if (confirm('This will delete old data based on your retention settings. Continue?')) {
      await privacyManager.cleanupOldData();
      alert('Old data cleaned up successfully');
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
      </div>

      {/* Privacy Settings */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Privacy Settings</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Encrypt Sensitive Data</label>
              <p className="text-sm text-gray-500">Encrypt API keys and personal data</p>
            </div>
            <button
              onClick={() => updateSetting('encryptSensitiveData', !settings.encryptSensitiveData)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.encryptSensitiveData ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.encryptSensitiveData ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Log User Actions</label>
              <p className="text-sm text-gray-500">Keep audit trail of user activities</p>
            </div>
            <button
              onClick={() => updateSetting('logUserActions', !settings.logUserActions)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.logUserActions ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.logUserActions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Auto-Delete Old Data</label>
              <p className="text-sm text-gray-500">Automatically remove old data</p>
            </div>
            <button
              onClick={() => updateSetting('autoDeleteOldData', !settings.autoDeleteOldData)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoDeleteOldData ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoDeleteOldData ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-700">Data Retention (Days)</label>
              <p className="text-sm text-gray-500">How long to keep data</p>
            </div>
            <input
              type="number"
              value={settings.dataRetentionDays}
              onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>

      {/* Data Categories */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Data Categories</h3>
        
        <div className="space-y-3">
          {categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {category.sensitive ? (
                  <EyeOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{category.name}</div>
                  <div className="text-sm text-gray-500">{category.description}</div>
                  <div className="text-xs text-gray-400">
                    Retention: {category.retentionDays === -1 ? 'Never delete' : `${category.retentionDays} days`}
                    {category.encrypted && ' • Encrypted'}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => deleteCategory(category.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Delete all data in this category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Data Management</h3>
        
        <div className="flex gap-3">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Export Data
          </button>
          
          <button
            onClick={cleanupOldData}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup Old Data
          </button>
        </div>
      </div>
    </div>
  );
};