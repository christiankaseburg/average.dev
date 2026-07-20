import React from 'react';
import { Button, Panel } from '@average.dev/arena-ui';
import styles from './CustomizeCharacter.module.scss';

// ---------------------------------------------------------------------------
// CharacterPreview — purely visual SVG driven by bodyType + hairStyle
// ---------------------------------------------------------------------------

const BODY_COLORS: Record<string, string> = {
  human_light: '#ffccaa',
  human_dark: '#8b5a2b',
  orc: '#4caf50',
  elf: '#ffeebb',
};

interface CharacterPreviewProps {
  bodyType: string;
  hairStyle: string;
}

function CharacterPreview({ bodyType, hairStyle }: CharacterPreviewProps) {
  return (
    <div className={styles.preview}>
      <svg width="80" height="80" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill={BODY_COLORS[bodyType] ?? '#ffccaa'} />
        {hairStyle === 'short_brown' && (
          <ellipse cx="12" cy="6" rx="10" ry="5" fill="#5c4033" />
        )}
        {hairStyle === 'long_blonde' && (
          <g fill="#ffd700">
            <ellipse cx="12" cy="6" rx="10" ry="5" />
            <rect x="4" y="6" width="4" height="14" />
            <rect x="16" y="6" width="4" height="14" />
          </g>
        )}
        {hairStyle === 'mohawk' && (
          <rect x="10" y="0" width="4" height="12" fill="#e06c5c" />
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomizeCharacter — presentational, purely prop-driven
// ---------------------------------------------------------------------------

export interface CustomizeCharacterProps {
  bodyType: string;
  hairStyle: string;
  onBodyTypeChange: (value: string) => void;
  onHairStyleChange: (value: string) => void;
  onSave: () => void;
}

export function CustomizeCharacter({
  bodyType,
  hairStyle,
  onBodyTypeChange,
  onHairStyleChange,
  onSave,
}: CustomizeCharacterProps) {
  return (
    <Panel className={styles.panel}>
      <h1 className={styles.title}>CUSTOMIZE</h1>
      <p className={styles.subtitle}>Select Your Appearance</p>

      <div className={styles.form}>
        <CharacterPreview bodyType={bodyType} hairStyle={hairStyle} />

        <div className={styles.selectors}>
          <div className={styles.formGroup}>
            <label>Body Type</label>
            <select
              value={bodyType}
              onChange={e => onBodyTypeChange(e.target.value)}
              className={styles.select}
            >
              <option value="human_light">Human (Light)</option>
              <option value="human_dark">Human (Dark)</option>
              <option value="orc">Orc</option>
              <option value="elf">Elf</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Hair Style</label>
            <select
              value={hairStyle}
              onChange={e => onHairStyleChange(e.target.value)}
              className={styles.select}
            >
              <option value="bald">Bald</option>
              <option value="short_brown">Short Brown</option>
              <option value="long_blonde">Long Blonde</option>
              <option value="mohawk">Mohawk</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onSave} style={{ width: '100%' }}>
          Save &amp; Return
        </Button>
      </div>
    </Panel>
  );
}
