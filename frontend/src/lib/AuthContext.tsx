"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/lib/api';

interface Employee {
    Id: number;
    Username: string;
    FullName: string;
    Role: number; // 0=Admin, 1=Manager, 2=Cashier
    RoleName: string;
    LastLoginAt?: string;
}

interface AuthContextType {
    employee: Employee | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    isManager: boolean;
    isCashier: boolean;
    canAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Route access rules by role
const accessRules: Record<string, number[]> = {
    '/': [0, 1],              // Admin, Manager
    '/pos': [0, 1, 2],        // All
    '/products': [0, 1],      // Admin, Manager
    '/customers': [0, 1],     // Admin, Manager
    '/invoices': [0, 1, 2],   // All (cashier read-only)
    '/reports': [0, 1],       // Admin, Manager
    '/settings': [0],          // Admin only
    '/stock-movements': [0, 1], // Admin, Manager
    '/cash-register': [0, 1, 2], // All
    '/employees': [0],         // Admin only
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        getCurrentUser().then(data => {
            if (data?.loggedIn && data?.employee) {
                setEmployee(data.employee);
            }
            setIsLoading(false);
        }).catch(() => setIsLoading(false));
    }, []);

    const login = async (username: string, password: string) => {
        const result = await apiLogin(username, password);
        if (result?.success && result?.employee) {
            setEmployee(result.employee);
            return { success: true };
        }
        return { success: false, message: result?.message || 'Giriş başarısız!' };
    };

    const logout = async () => {
        await apiLogout();
        setEmployee(null);
    };

    const isAdmin = employee?.Role === 0;
    const isManager = employee?.Role === 1;
    const isCashier = employee?.Role === 2;

    const canAccess = (page: string) => {
        if (!employee) return false;
        const allowed = accessRules[page];
        if (!allowed) return true; // unknown pages allowed by default
        return allowed.includes(employee.Role);
    };

    return (
        <AuthContext.Provider value={{ employee, isLoading, login, logout, isAdmin, isManager, isCashier, canAccess }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
