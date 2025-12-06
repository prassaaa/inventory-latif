import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    confirmText?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    isLoading?: boolean;
    variant?: 'default' | 'destructive';
    children?: React.ReactNode;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel,
    confirmText,
    cancelLabel = 'Batal',
    onConfirm,
    isLoading = false,
    variant = 'default',
    children,
}: ConfirmDialogProps) {
    const buttonLabel = confirmLabel ?? confirmText ?? 'Konfirmasi';

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                {children}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button variant={variant} onClick={onConfirm} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {buttonLabel}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface DeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm: () => void;
    isLoading?: boolean;
    itemName?: string;
}

export function DeleteDialog({
    open,
    onOpenChange,
    title = 'Hapus Data',
    description,
    onConfirm,
    isLoading = false,
    itemName,
}: DeleteDialogProps) {
    const defaultDescription = itemName
        ? `Apakah Anda yakin ingin menghapus "${itemName}"? Tindakan ini tidak dapat dibatalkan.`
        : 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.';

    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description ?? defaultDescription}
            confirmLabel="Hapus"
            onConfirm={onConfirm}
            isLoading={isLoading}
            variant="destructive"
        />
    );
}

