"use client";
import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from './Button'

describe('Button Component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary text-white border-transparent');
  });

  test('renders correctly with variant "white"', () => {
    render(<Button variant="white">White Button</Button>);
    const button = screen.getByRole('button', { name: /white button/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-white text-black border-[#D5D7DA]');
  });

  test('renders with additional className', () => {
    render(<Button className="custom-class">Styled Button</Button>);
    const button = screen.getByRole('button', { name: /styled button/i });

    expect(button).toHaveClass('custom-class');
  });

  test('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:cursor-not-allowed disabled:opacity-50');
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
