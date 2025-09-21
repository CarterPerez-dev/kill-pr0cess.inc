/*
 * Reusable button component with consistent styling, accessibility features, and various states for the dark-themed UI system.
 * I'm implementing comprehensive button variants, interaction states, and accessibility compliance to maintain design consistency across the application.
 */

import { Component, JSX, splitProps } from 'solid-js';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: JSX.Element;
  rightIcon?: JSX.Element;
  children: JSX.Element;
}

export const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, [
    'variant',
    'size',
    'isLoading',
    'isDisabled',
    'fullWidth',
    'leftIcon',
    'rightIcon',
    'children',
    'class'
  ]);

  // I'm defining the base styles and variants for consistent theming
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-mono text-sm tracking-wide
    transition-all duration-200 ease-in-out focus:outline-none focus:ring-2
    focus:ring-offset-2 focus:ring-offset-black disabled:cursor-not-allowed
    relative overflow-hidden
  `;

  const getVariantStyles = () => {
    const variant = local.variant || 'primary';

    switch (variant) {
      case 'primary':
        return `
          bg-neutral-100 text-black border border-neutral-100
          hover:bg-neutral-200 hover:border-neutral-200
          focus:ring-neutral-400
          disabled:bg-neutral-600 disabled:text-neutral-400 disabled:border-neutral-600
          active:scale-95
        `;

      case 'secondary':
        return `
          bg-transparent text-neutral-100 border border-neutral-600
          hover:bg-neutral-800 hover:border-neutral-500
          focus:ring-neutral-500
          disabled:text-neutral-600 disabled:border-neutral-700
          active:scale-95
        `;

      case 'ghost':
        return `
          bg-transparent text-neutral-400 border border-transparent
          hover:bg-neutral-800/50 hover:text-neutral-200
          focus:ring-neutral-600
          disabled:text-neutral-700
          active:scale-95
        `;

      case 'danger':
        return `
          bg-red-600 text-white border border-red-600
          hover:bg-red-700 hover:border-red-700
          focus:ring-red-500
          disabled:bg-red-800 disabled:border-red-800
          active:scale-95
        `;

      case 'success':
        return `
          bg-green-600 text-white border border-green-600
          hover:bg-green-700 hover:border-green-700
          focus:ring-green-500
          disabled:bg-green-800 disabled:border-green-800
          active:scale-95
        `;

      default:
        return '';
    }
  };

  const getSizeStyles = () => {
    const size = local.size || 'md';

    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-xs min-h-[2rem]';
      case 'lg':
        return 'px-8 py-4 text-base min-h-[3rem]';
      case 'md':
      default:
        return 'px-6 py-2.5 text-sm min-h-[2.5rem]';
    }
  };

  const isDisabled = () => local.isDisabled || local.isLoading;

  return (
    <button
      {...others}
      disabled={isDisabled()}
      class={`
        ${baseStyles}
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${local.fullWidth ? 'w-full' : ''}
        ${local.class || ''}
      `}
      aria-disabled={isDisabled()}
    >
      {/* Loading spinner overlay */}
      {local.isLoading && (
        <div class="absolute inset-0 flex items-center justify-center bg-current/10">
          <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Button content */}
      <div class={`flex items-center gap-2 ${local.isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
        {local.leftIcon && (
          <span class="flex-shrink-0">
            {local.leftIcon}
          </span>
        )}

        <span class="truncate">
          {local.children}
        </span>

        {local.rightIcon && (
          <span class="flex-shrink-0">
            {local.rightIcon}
          </span>
        )}
      </div>

      {/* Subtle glow effect for primary variant */}
      {local.variant === 'primary' && !isDisabled() && (
        <div class="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-[inherit]"></div>
      )}
    </button>
  );
};
