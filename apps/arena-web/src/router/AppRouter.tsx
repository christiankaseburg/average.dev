import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StandardTemplate } from '../templates/StandardTemplate/StandardTemplate';
import { GameTemplate } from '../templates/GameTemplate/GameTemplate';
import { HomePage } from '../pages/Home/HomePage';
import { GamePage } from '../pages/Game/GamePage';
import { GameOverPage } from '../pages/Game/GameOver/GameOverPage';
import { ProtectedGameRoute } from './ProtectedGameRoute';

/**
 * Defines all application routes with their layout templates.
 *
 * StandardTemplate: grid background + ThemeToggle (content-focused pages)
 * GameTemplate:     bare full-screen shell (gameplay + game-over)
 *
 * /game and /gameover are protected — ProtectedGameRoute redirects to /
 * if no active room exists in GameContext.
 */
export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Content pages — grid background, theme toggle */}
        <Route element={<StandardTemplate />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* Game pages — bare full-screen, no chrome */}
        <Route element={<GameTemplate />}>
          <Route
            path="/game"
            element={
              <ProtectedGameRoute>
                <GamePage />
              </ProtectedGameRoute>
            }
          />
          <Route
            path="/gameover"
            element={
              <ProtectedGameRoute>
                <GameOverPage />
              </ProtectedGameRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
