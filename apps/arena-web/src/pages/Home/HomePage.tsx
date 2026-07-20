import React from 'react';
import { Button, TextInput, Panel } from '@average.dev/arena-ui';
import { CustomizeCharacter } from '../../components/CustomizeCharacter/CustomizeCharacter';
import { useHomeState } from './state/useHomeState';
import styles from './HomePage.module.scss';

/**
 * Home page — rendered inside StandardTemplate which provides the
 * grid background, centering, and ThemeToggle. This component is
 * responsible only for the panel content and state wiring.
 */
export function HomePage() {
  const {
    state,
    dispatch,
    deviceType,
    handleQuickPlay,
    handleSandbox,
    handleJoinByCode,
    handleSaveCustomization,
  } = useHomeState();

  if (state.showCustomize) {
    return (
      <CustomizeCharacter
        bodyType={state.bodyType}
        hairStyle={state.hairStyle}
        onBodyTypeChange={payload => dispatch({ type: 'SET_BODY_TYPE', payload })}
        onHairStyleChange={payload => dispatch({ type: 'SET_HAIR_STYLE', payload })}
        onSave={handleSaveCustomization}
      />
    );
  }

  return (
    <>
      <Panel className={styles.panel}>
        <h1 className={styles.title}>ARENA</h1>
        <p className={styles.subtitle}>Medieval Battle Royale</p>

        <TextInput
          placeholder="Enter Display Name"
          value={state.name}
          onChange={e => dispatch({ type: 'SET_NAME', payload: e.target.value })}
          maxLength={16}
          style={{ marginBottom: '1.5rem' }}
        />

        {state.error && <div className={styles.error}>{state.error}</div>}

        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleQuickPlay}
            disabled={state.connecting}
            style={{ width: '100%' }}
          >
            {state.connecting ? 'Connecting...' : 'Quick Play'}
          </Button>

          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'SHOW_CUSTOMIZE' })}
            disabled={state.connecting}
            style={{ width: '100%' }}
          >
            Customize Character
          </Button>

          <div className={styles.divider}><span>OR</span></div>

          <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
            <TextInput
              placeholder="Room Code"
              value={state.roomCode}
              onChange={e => dispatch({ type: 'SET_ROOM_CODE', payload: e.target.value.toUpperCase() })}
              style={{ flex: 1 }}
            />
            <Button variant="secondary" onClick={handleJoinByCode} disabled={state.connecting}>
              Join
            </Button>
          </div>

          {import.meta.env.DEV && (
            <Button
              variant="secondary"
              onClick={handleSandbox}
              disabled={state.connecting}
              style={{ width: '100%', marginTop: '1.5rem', border: '1px solid #4caf50' }}
            >
              Test in Sandbox
            </Button>
          )}
        </div>
      </Panel>

      <div className={styles.footer}>
        Device: {deviceType.toUpperCase()}
      </div>
    </>
  );
}
