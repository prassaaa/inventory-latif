import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { Store } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Brand */}
                <Link href={home()} className="flex items-center justify-center gap-3 mb-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg">
                        <Store className="h-7 w-7 text-primary-foreground" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-bold">Inventory System</h1>
                        <p className="text-sm text-muted-foreground">Manajemen Stok Modern</p>
                    </div>
                </Link>

                {/* Login Card */}
                <Card className="shadow-2xl border-2">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                        <CardDescription className="text-base">{description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {children}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground mt-6">
                    &copy; {new Date().getFullYear()} Inventory System. All rights reserved.
                </p>
            </div>
        </div>
    );
}
