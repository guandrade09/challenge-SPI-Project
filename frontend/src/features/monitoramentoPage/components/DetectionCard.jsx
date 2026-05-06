import React from 'react';

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 8,
        border: `1px solid ${isChecked ? 'rgba(60,200,122,0.35)' : '#2a2d35'}`,
        background: isChecked ? 'rgba(60,200,122,0.06)' : '#17191e',
        cursor: 'pointer',
        userSelect: 'none',
        width: '100%',
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 2,
        background: isChecked ? '#3cc87a' : 'transparent',
        transition: 'background 0.2s',
        borderRadius: '8px 0 0 8px',
      }} />

      {/* Checkbox */}
      <div style={{
        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isChecked ? '#3cc87a' : 'transparent',
        border: `1.5px solid ${isChecked ? '#3cc87a' : '#3d4050'}`,
        transition: 'all 0.15s',
      }}>
        {isChecked && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Label */}
      <span style={{
        fontFamily: "'Barlow Condensed', 'Barlow', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: isChecked ? '#a8f0c6' : '#6a6e7a',
        transition: 'color 0.15s',
      }}>
        {label}
      </span>

      {/* Badge */}
      <span style={{
        marginLeft: 'auto',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: isChecked ? 'rgba(60,200,122,0.6)' : 'transparent',
        transition: 'color 0.2s',
      }}>
        ativo
      </span>
    </div>
  );
};

export default DetectionCard;