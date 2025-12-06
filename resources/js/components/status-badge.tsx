import { Badge } from '@/components/ui/badge';
import {
    paymentMethodColors,
    paymentMethodLabels,
    PaymentMethodType,
    stockMovementColors,
    stockMovementLabels,
    StockMovementTypeLabel,
    transferStatusColors,
    transferStatusLabels,
    TransferStatusType,
} from '@/lib/utils';

interface TransferStatusBadgeProps {
    status: TransferStatusType;
}

export function TransferStatusBadge({ status }: TransferStatusBadgeProps) {
    return (
        <Badge variant="outline" className={transferStatusColors[status]}>
            {transferStatusLabels[status]}
        </Badge>
    );
}

interface PaymentMethodBadgeProps {
    method: PaymentMethodType;
}

export function PaymentMethodBadge({ method }: PaymentMethodBadgeProps) {
    return (
        <Badge variant="outline" className={paymentMethodColors[method]}>
            {paymentMethodLabels[method]}
        </Badge>
    );
}

interface StockMovementBadgeProps {
    type: StockMovementTypeLabel;
}

export function StockMovementBadge({ type }: StockMovementBadgeProps) {
    return (
        <Badge variant="outline" className={stockMovementColors[type]}>
            {stockMovementLabels[type]}
        </Badge>
    );
}

interface ActiveBadgeProps {
    isActive: boolean;
}

export function ActiveBadge({ isActive }: ActiveBadgeProps) {
    return (
        <Badge variant="outline" className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            {isActive ? 'Aktif' : 'Non-Aktif'}
        </Badge>
    );
}

export function LowStockBadge() {
    return (
        <Badge variant="outline" className="bg-red-100 text-red-800">
            Stok Rendah
        </Badge>
    );
}

interface RoleBadgeProps {
    role: string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    const colors: Record<string, string> = {
        super_admin: 'bg-purple-100 text-purple-800',
        admin_cabang: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
        super_admin: 'Super Admin',
        admin_cabang: 'Admin Cabang',
    };
    return (
        <Badge variant="outline" className={colors[role] || 'bg-gray-100 text-gray-800'}>
            {labels[role] || role}
        </Badge>
    );
}

