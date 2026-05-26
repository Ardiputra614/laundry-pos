import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { LoadingScreen } from './LoadingScreen';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === 'superadmin') {
        router.replace('/(app)/superadmin/overview');
      } else {
        router.replace('/(app)');
      }
    }
  }, [user, isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return <>{children}</>;
}
