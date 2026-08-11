import React from 'react';
import Menu from './Menu';

// Extend the Window interface to include __STORYBOOK_PATHNAME
declare global {
  interface Window {
    __STORYBOOK_PATHNAME?: string;
  }
}

// Sample menu items are defined in ./data.js

export default {
  title: 'Navigation/Menu',
  component: Menu,
  parameters: {
    layout: 'fullwidth',
    nextjs: {
      appDirectory: true,
    },
  },
  argTypes: {
    pathname: {
      control: 'select',
      options: ['/', '/about', '/services', '/contact', '/other'],
      description: 'Current active path',
      defaultValue: '/',
    },
  },
};

// Template for all stories
import { StoryFn } from '@storybook/react';

const Template: StoryFn<{ pathname: string }> = ({ pathname }) => {
  // Set the pathname for the story
  window.__STORYBOOK_PATHNAME = pathname;
  
  return <Menu />;
};

// Default story with home active
export const Default = Template.bind({});
Default.args = {
  pathname: '/',
};

// About page active
export const AboutActive = Template.bind({});
AboutActive.args = {
  pathname: '/about',
};

// Services page active
export const ServicesActive = Template.bind({});
ServicesActive.args = {
  pathname: '/services',
};

// Contact page active
export const ContactActive = Template.bind({});
ContactActive.args = {
  pathname: '/contact',
};

// No active menu item
export const NoActiveItem = Template.bind({});
NoActiveItem.args = {
  pathname: '/other',
};