"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth/use-session';
import { FeatureFlagKey } from './feature-flags';

interface FeatureState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
}

// Hook to check if a single feature is enabled
export function useFeature(featureKey: FeatureFlagKey): FeatureState {
  const { user } = useSession();
  const [state, setState] = useState<FeatureState>({
    enabled: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkFeature() {
      if (!user) {
        setState({ enabled: false, loading: false, error: null });
        return;
      }

      try {
        const response = await fetch(`/api/features/check?key=${featureKey}`);
        const result = await response.json();

        if (result.success) {
          setState({
            enabled: result.enabled,
            loading: false,
            error: null,
          });
        } else {
          setState({
            enabled: false,
            loading: false,
            error: result.error || 'Failed to check feature',
          });
        }
      } catch (error) {
        setState({
          enabled: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    checkFeature();
  }, [featureKey, user]);

  return state;
}

// Hook to check multiple features at once
export function useFeatures(featureKeys: FeatureFlagKey[]): Record<FeatureFlagKey, FeatureState> {
  const { user } = useSession();
  const [states, setStates] = useState<Record<FeatureFlagKey, FeatureState>>(
    featureKeys.reduce((acc, key) => ({
      ...acc,
      [key]: { enabled: false, loading: true, error: null },
    }), {} as Record<FeatureFlagKey, FeatureState>)
  );

  useEffect(() => {
    async function checkFeatures() {
      if (!user) {
        setStates(
          featureKeys.reduce((acc, key) => ({
            ...acc,
            [key]: { enabled: false, loading: false, error: null },
          }), {} as Record<FeatureFlagKey, FeatureState>)
        );
        return;
      }

      try {
        const response = await fetch('/api/features/check-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: featureKeys }),
        });
        const result = await response.json();

        if (result.success) {
          setStates(
            featureKeys.reduce((acc, key) => ({
              ...acc,
              [key]: {
                enabled: result.features[key] || false,
                loading: false,
                error: null,
              },
            }), {} as Record<FeatureFlagKey, FeatureState>)
          );
        } else {
          setStates(
            featureKeys.reduce((acc, key) => ({
              ...acc,
              [key]: { enabled: false, loading: false, error: result.error },
            }), {} as Record<FeatureFlagKey, FeatureState>)
          );
        }
      } catch (error) {
        setStates(
          featureKeys.reduce((acc, key) => ({
            ...acc,
            [key]: {
              enabled: false,
              loading: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          }), {} as Record<FeatureFlagKey, FeatureState>)
        );
      }
    }

    checkFeatures();
  }, [featureKeys.join(','), user]);

  return states;
}

// Hook to get all enabled features for the current user
export function useEnabledFeatures(): {
  features: string[];
  loading: boolean;
  error: string | null;
} {
  const { user } = useSession();
  const [state, setState] = useState<{
    features: string[];
    loading: boolean;
    error: string | null;
  }>({
    features: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchEnabledFeatures() {
      if (!user) {
        setState({ features: [], loading: false, error: null });
        return;
      }

      try {
        const response = await fetch('/api/features/enabled');
        const result = await response.json();

        if (result.success) {
          setState({
            features: result.features,
            loading: false,
            error: null,
          });
        } else {
          setState({
            features: [],
            loading: false,
            error: result.error || 'Failed to fetch features',
          });
        }
      } catch (error) {
        setState({
          features: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    fetchEnabledFeatures();
  }, [user]);

  return state;
}

// Higher-order component for feature-gated components
export function withFeature<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  featureKey: FeatureFlagKey,
  FallbackComponent?: React.ComponentType<P>
): React.FC<P> {
  const FeatureGatedComponent: React.FC<P> = (props) => {
    const { enabled, loading } = useFeature(featureKey);

    if (loading) {
      return null;
    }

    if (!enabled) {
      if (FallbackComponent) {
        return React.createElement(FallbackComponent, props);
      }
      return null;
    }

    return React.createElement(Component, props);
  };

  FeatureGatedComponent.displayName = `withFeature(${Component.displayName || Component.name})`;
  return FeatureGatedComponent;
}

// Component for conditional rendering based on feature flag
interface FeatureGateProps {
  feature: FeatureFlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function FeatureGate(props: FeatureGateProps): React.ReactElement | null {
  const { feature, children, fallback = null, loadingComponent = null } = props;
  const { enabled, loading } = useFeature(feature);

  if (loading) {
    return React.createElement(React.Fragment, null, loadingComponent);
  }

  if (!enabled) {
    return React.createElement(React.Fragment, null, fallback);
  }

  return React.createElement(React.Fragment, null, children);
}

// Hook for admin feature flag management
export function useFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/admin/features', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setFlags(result.data);
        setError(null);
      } else {
        setFlags([]);
        setError(result.error || 'Failed to fetch feature flags');
      }
    } catch (err) {
      setFlags([]);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFlag = useCallback(async (id: string, updates: Partial<any>) => {
    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const result = await response.json();

      if (result.success) {
        await fetchFlags();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchFlags]);

  const createFlag = useCallback(async (flag: any) => {
    try {
      const response = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flag),
      });
      const result = await response.json();

      if (result.success) {
        await fetchFlags();
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchFlags]);

  const deleteFlag = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/admin/features/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        await fetchFlags();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }, [fetchFlags]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    loading,
    error,
    fetchFlags,
    updateFlag,
    createFlag,
    deleteFlag,
  };
}
