
import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
    return (
        <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
            { (title || action) && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                    {title && <h2 className="text-xl font-semibold text-slate-700">{title}</h2>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
