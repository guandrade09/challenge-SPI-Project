import React from 'react';

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
    <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DetectionCard = ({ label, isChecked, onToggle }) => {
  const cardClass = isChecked
    ? 'detection-card detection-card--checked'
    : 'detection-card detection-card--unchecked';

  return (
    <div onClick={onToggle} className={cardClass}>
      <div
        className="absolute left-0 top-0 bottom-0"
        style={{
          width: 2,
          background: isChecked ? '#3cc87a' : 'transparent',
          transition: 'background .2s',
          borderRadius: '8px 0 0 8px',
        }}
      />

      <div
        className="flex items-center justify-center shrink-0 rounded"
        style={{
          width: 18, height: 18,
          background: isChecked ? '#3cc87a' : 'transparent',
          border: `1.5px solid ${isChecked ? '#3cc87a' : '#3d4050'}`,
          transition: 'all .15s',
        }}
      >
        {isChecked && <CheckIcon />}
      </div>

      <span
        className="shrink-0"
        style={{
          fontFamily: "'Barlow Condensed','Barlow',sans-serif",
          fontSize: 13, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          color: isChecked ? '#a8f0c6' : '#6a6e7a',
          transition: 'color .15s',
        }}
      >
        {label}
      </span>

      <span
        className="ml-auto"
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
          color: isChecked ? 'rgba(60,200,122,0.6)' : 'transparent',
          transition: 'color .2s',
        }}
      >
        ativo
      </span>
    </div>
  );
};

export default DetectionCard;