// src/pages/Settings.jsx
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Save,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    // General
    hospitalName: 'City General Hospital',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',

    // Notifications
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    alertSound: true,

    // Security
    sessionTimeout: 30,
    twoFactorAuth: false,
    passwordExpiry: 90,

    // Display
    theme: 'light',
    compactMode: false,
    showWelcomeMessage: true,
  });

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'display', label: 'Display', icon: Palette },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name
                </label>
                <input
                  type="text"
                  value={settings.hospitalName}
                  onChange={(e) => handleChange('hospitalName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => handleChange('dateFormat', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <ToggleSetting
                label="Email Notifications"
                description="Receive email alerts for important events"
                checked={settings.emailNotifications}
                onChange={(val) => handleChange('emailNotifications', val)}
              />
              <ToggleSetting
                label="SMS Notifications"
                description="Receive text messages for critical alerts"
                checked={settings.smsNotifications}
                onChange={(val) => handleChange('smsNotifications', val)}
              />
              <ToggleSetting
                label="Push Notifications"
                description="Receive browser push notifications"
                checked={settings.pushNotifications}
                onChange={(val) => handleChange('pushNotifications', val)}
              />
              <ToggleSetting
                label="Alert Sound"
                description="Play sound for new notifications"
                checked={settings.alertSound}
                onChange={(val) => handleChange('alertSound', val)}
              />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={5}
                  max={120}
                />
              </div>

              <ToggleSetting
                label="Two-Factor Authentication"
                description="Require 2FA for login"
                checked={settings.twoFactorAuth}
                onChange={(val) => handleChange('twoFactorAuth', val)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Expiry (days)
                </label>
                <input
                  type="number"
                  value={settings.passwordExpiry}
                  onChange={(e) => handleChange('passwordExpiry', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={30}
                  max={365}
                />
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <div className="flex gap-4">
                  {['light', 'dark', 'system'].map(theme => (
                    <button
                      key={theme}
                      onClick={() => handleChange('theme', theme)}
                      className={`px-4 py-2 rounded-xl border-2 capitalize ${
                        settings.theme === theme
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleSetting
                label="Compact Mode"
                description="Use smaller spacing and fonts"
                checked={settings.compactMode}
                onChange={(val) => handleChange('compactMode', val)}
              />

              <ToggleSetting
                label="Show Welcome Message"
                description="Display greeting on dashboard"
                checked={settings.showWelcomeMessage}
                onChange={(val) => handleChange('showWelcomeMessage', val)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Toggle Setting Component
const ToggleSetting = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default Settings;