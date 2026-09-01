import React from 'react';

export function EventMetricsCard({ title, value, icon: Icon, colorClass, valueColorClass }) {
  return (
    <div className="panel-subcard flex items-center justify-between shadow-sm">
      <div>
        <p className="text-theme-head">
          {title}
        </p>
        <h3 className={`text-2xl font-bold mt-1 font-theme-title ${valueColorClass || 'text-[var(--p-text)]'}`}>
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-lg border ${colorClass}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}

export default EventMetricsCard;