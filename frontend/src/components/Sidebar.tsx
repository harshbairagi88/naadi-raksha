import React from 'react';
import { ICONS } from '../constants';
import { HealthBloodPressure, HealthData } from '../types';

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  userName?: string;
  healthData?: HealthData | null;
  healthLoading?: boolean;
  healthError?: string;
  healthUpdatedAt?: number;
  // Props from previous interface ignored for this visual overhaul
  conversations?: any;
  activeId?: any;
  onSelect?: any;
  onNew?: any;
  onDelete?: any;
}

const formatValue = (value?: number, suffix?: string, digits = 0) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  const formatted = value.toFixed(digits);
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatTemperature = (value?: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  const fahrenheit = (value * 9) / 5 + 32;
  return `${value.toFixed(1)}°C (${fahrenheit.toFixed(1)}°F)`;
};

const formatBloodPressure = (bloodPressure?: HealthBloodPressure) => {
  if (!bloodPressure) return '--';
  const systolic =
    bloodPressure.systolic === null || bloodPressure.systolic === undefined
      ? '--'
      : bloodPressure.systolic;
  const diastolic =
    bloodPressure.diastolic === null || bloodPressure.diastolic === undefined
      ? '--'
      : bloodPressure.diastolic;
  if (systolic === '--' && diastolic === '--') return '--';
  const unit = bloodPressure.unit || 'mmHg';
  return `${systolic}/${diastolic} ${unit}`;
};

const formatTimestamp = (value?: string) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString();
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onLogout,
  userName = 'User',
  healthData = null,
  healthLoading = false,
  healthError = '',
  healthUpdatedAt,
}) => {
  const metrics = healthData?.metrics;
  const activity = healthData?.activity;
  const battery = healthData?.battery;
  const signal = healthData?.signal;
  const lastCaptured = healthData?.capturedAt || healthData?.receivedAt;
  const lastUpdated = lastCaptured || (healthUpdatedAt ? new Date(healthUpdatedAt).toISOString() : '');

  const primaryVitals = [
    {
      label: 'Pulse Rate',
      value: formatValue(metrics?.pulseRateBpm, 'bpm'),
      icon: <ICONS.Pulse />,
      badgeClass: 'bg-yellow-600/30 text-yellow-200',
    },
    {
      label: 'Blood Pressure',
      value: formatBloodPressure(metrics?.bloodPressure),
      icon: <ICONS.Activity />,
      badgeClass: 'bg-red-600/30 text-red-200',
    },
    {
      label: 'Body Temp',
      value: formatTemperature(metrics?.temperatureC),
      icon: <ICONS.Temp />,
      badgeClass: 'bg-orange-600/30 text-orange-200',
    },
  ];

  const secondaryVitals = [
    { label: 'SpO2', value: formatValue(metrics?.spo2Percent, '%') },
    { label: 'Respiration', value: formatValue(metrics?.respirationRateBpm, 'bpm') },
    { label: 'Glucose', value: formatValue(metrics?.glucoseMgDl, 'mg/dL') },
    { label: 'Steps', value: formatValue(activity?.steps) },
    {
      label: 'Battery',
      value: battery
        ? `${formatValue(battery.levelPercent, '%')}${battery.charging ? ' • charging' : ''}`
        : '--',
    },
    { label: 'Signal', value: formatValue(signal?.rssi, 'dBm') },
  ];

  return (
    <div
      className={`
      fixed inset-y-0 left-0 z-40 w-80 bg-gradient-to-b from-ayur-dark to-ayur-green text-white transform transition-transform duration-300 ease-in-out flex flex-col font-sans overflow-hidden shadow-2xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}
    >
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      ></div>

      <div className="relative flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* User Profile Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <ICONS.User />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">{userName}</h2>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 bg-green-400 rounded-full"></span>
                <span className="text-xs text-green-100 uppercase tracking-widest">
                  Active Patient
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-semibold text-green-100 uppercase tracking-wide">
                Clinical Snapshot
              </h3>
              <ICONS.Settings />
            </div>

            {(healthLoading || healthError) && (
              <div className="text-xs text-white/70 mb-2">
                {healthError ? healthError : 'Loading latest device data...'}
              </div>
            )}

            {/* Vitals */}
            <div className="space-y-4 mt-3">
              {primaryVitals.map(item => (
                <div
                  key={item.label}
                  className="flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg ${item.badgeClass}`}>{item.icon}</div>
                    <span className="text-sm text-gray-100">{item.label}</span>
                  </div>
                  <span className="font-mono font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-white/10 pt-3 space-y-3">
              {secondaryVitals.map(item => (
                <div
                  key={item.label}
                  className="flex items-center justify-between text-sm text-gray-100"
                >
                  <span>{item.label}</span>
                  <span className="font-mono font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-white/60 space-y-1">
              <div>
                Device:{' '}
                <span className="font-mono text-white/80">
                  {healthData?.deviceId || 'Not linked'}
                </span>
              </div>
              <div>
                Last update:{' '}
                <span className="font-mono text-white/80">{formatTimestamp(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Section */}
        <div className="px-6 mb-4">
          <h3 className="text-sm font-semibold text-green-200/80 uppercase tracking-wide mb-3 border-b border-white/10 pb-1">
            Ayurvedic Assessment
          </h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-sm text-gray-200">
              <ICONS.CheckCircle />
              <span>
                <strong className="text-white">Digestion:</strong> Acidity & Heartburn
              </span>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-200">
              <div className="opacity-50">
                <ICONS.CheckCircle />
              </div>
              <span>
                <strong className="text-white">Sleep Pattern:</strong> Disturbed Sleep
              </span>
            </div>
            <div className="flex items-start space-x-2 text-sm text-gray-200">
              <div className="text-yellow-400">
                <ICONS.Pulse />
              </div>
              <span>
                <strong className="text-white">Stress Level:</strong> High
              </span>
            </div>
          </div>
        </div>

        {/* Imbalance Card */}
        <div className="px-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-green-200/80 uppercase tracking-wide">
              Current Imbalance
            </h3>
            <span className="text-xs text-white/50">Details ^</span>
          </div>
          <div className="bg-orange-100/10 border border-orange-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-ayur-accent font-bold">
              <span className="p-1 bg-ayur-accent/20 rounded">
                <ICONS.Temp />
              </span>
              <span>Pitta Aggravation</span>
            </div>
          </div>
        </div>

        {/* Plan Section */}
        <div className="px-6 flex-1">
          <h3 className="text-sm font-semibold text-green-200/80 uppercase tracking-wide mb-3 border-b border-white/10 pb-1">
            Doctor-Approved Plan
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="h-8 w-8 bg-green-900/50 rounded flex items-center justify-center text-green-300 border border-green-700">
                <ICONS.Bowl />
              </div>
              <span className="text-sm text-white">Cooling Diet</span>
            </div>
            <div className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="h-8 w-8 bg-amber-900/50 rounded flex items-center justify-center text-amber-300 border border-amber-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>
              <span className="text-sm text-white">Virechana Therapy</span>
            </div>
            <div className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
              <div className="h-8 w-8 bg-emerald-900/50 rounded flex items-center justify-center text-emerald-300 border border-emerald-700">
                <ICONS.Leaf />
              </div>
              <span className="text-sm text-white">Herbs: Yashtimadhu & Amalaki</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto">
          <button
            onClick={onLogout}
            className="w-full py-2 border border-white/20 rounded-lg text-xs text-white/60 hover:bg-white/10 transition-colors uppercase tracking-widest"
          >
            Exit Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
