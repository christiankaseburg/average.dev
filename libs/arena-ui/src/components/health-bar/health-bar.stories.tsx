import type { Meta, StoryObj } from '@storybook/react';
import { HealthBar } from './health-bar';

const meta: Meta<typeof HealthBar> = {
  component: HealthBar,
  title: 'Foundational/HealthBar',
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0f' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof HealthBar>;

export const FullHealth: Story = {
  args: {
    current: 100,
    max: 100,
  },
};

export const HalfHealth: Story = {
  args: {
    current: 50,
    max: 100,
  },
};

export const LowHealth: Story = {
  args: {
    current: 15,
    max: 100,
  },
};

export const WithoutText: Story = {
  args: {
    current: 80,
    max: 100,
    showText: false,
  },
};
