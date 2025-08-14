import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
    Icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', className, Icon, ...props }) => {
    const baseClasses = 'inline-flex items-center justify-center border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50 focus:ring-blue-500',
        danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
    };

    const hasChildren = React.Children.count(children) > 0;
    const paddingClasses = hasChildren ? 'px-4 py-2' : 'p-2';
    const iconMarginClass = hasChildren ? 'mr-2 -ml-1' : '';


    return (
        <button
            {...props}
            className={`${baseClasses} ${paddingClasses} ${variantClasses[variant]} ${className}`}
        >
            {Icon && <span className={iconMarginClass}>{Icon}</span>}
            {children}
        </button>
    );
};
