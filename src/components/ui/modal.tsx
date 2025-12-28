import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}: ModalProps) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}>
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        {title && <h2 className="text-xl font-bold text-gray-900">{title}</h2>}
                        {showCloseButton && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="ml-auto"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ModalHeaderProps {
    children: React.ReactNode;
}

export function ModalHeader({ children }: ModalHeaderProps) {
    return <div className="px-6 py-4 border-b">{children}</div>;
}

interface ModalBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
    return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

interface ModalFooterProps {
    children: React.ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
    return (
        <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-end gap-3">
            {children}
        </div>
    );
}
