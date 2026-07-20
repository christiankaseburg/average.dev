import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from './panel';

const meta: Meta<typeof Panel> = {
  component: Panel,
  title: 'Foundational/Panel',
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'game-bg',
      values: [
        { name: 'game-bg', value: '#2a2a3a' }, // Slightly lighter to show contrast
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  args: {
    children: (
      <div>
        <h2 style={{ margin: '0 0 1rem 0' }}>Lobby Settings</h2>
        <p style={{ color: '#a0a0b0' }}>Configure your game options here before joining the arena.</p>
      </div>
    ),
  },
};
