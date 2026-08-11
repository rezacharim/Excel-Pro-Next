import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
    disabled: { control: 'boolean' },
    variant: { control: 'select', options: ['primary', 'white'] },
    onClick: { action: 'clicked' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
  },
};

export const White: Story = {
  args: {
    children: 'White Button',
    variant: 'white',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Button',
    disabled: true,
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    className: 'bg-gray-500 border-gray-700',
  },
};

export const Wide: Story = {
  args: {
    children: 'Wide Button',
    className: 'w-[200px]',
  },
};
