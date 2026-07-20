import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Swords } from 'lucide-react';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Foundational/Button',
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
    disabled: {
      control: 'boolean',
    },
  },
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
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Quick Play',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Settings',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Leave Match',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Attack',
    icon: <Swords size={18} />,
  },
};
