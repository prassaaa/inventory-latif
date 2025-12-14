import { toast as sonnerToast } from 'sonner';

/**
 * Toast helper functions for consistent notifications across the app
 */
export const toast = {
    /**
     * Show success toast
     */
    success: (message: string, description?: string) => {
        return sonnerToast.success(message, {
            description,
        });
    },

    /**
     * Show error toast
     */
    error: (message: string, description?: string) => {
        return sonnerToast.error(message, {
            description,
        });
    },

    /**
     * Show info toast
     */
    info: (message: string, description?: string) => {
        return sonnerToast.info(message, {
            description,
        });
    },

    /**
     * Show warning toast
     */
    warning: (message: string, description?: string) => {
        return sonnerToast.warning(message, {
            description,
        });
    },

    /**
     * Show loading toast
     */
    loading: (message: string, description?: string) => {
        return sonnerToast.loading(message, {
            description,
        });
    },

    /**
     * Show promise toast with loading, success, and error states
     */
    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        },
    ) => {
        return sonnerToast.promise(promise, messages);
    },

    /**
     * Dismiss a specific toast or all toasts
     */
    dismiss: (toastId?: string | number) => {
        return sonnerToast.dismiss(toastId);
    },

    /**
     * Custom toast with action button
     */
    custom: (
        message: string,
        options?: {
            description?: string;
            action?: {
                label: string;
                onClick: () => void;
            };
            duration?: number;
        },
    ) => {
        return sonnerToast(message, {
            description: options?.description,
            action: options?.action,
            duration: options?.duration,
        });
    },
};

