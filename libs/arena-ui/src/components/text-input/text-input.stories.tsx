import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './text-input';
import { Search } from 'lucide-react';

const meta: Meta<typeof TextInput> = {
  component: TextInput,
  title: 'Foundational/TextInput',
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
type Story = StoryObj<typeof TextInput>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'player123',
  },
};

export const WithIcon: Story = {
  args: {
    placeholder: 'Search rooms...',
    icon: <Search size={18} />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Room Code',
    placeholder: 'ABCD',
    error: 'Room not found.',
  },
};
