import { useState, useEffect } from 'react';
import { supabase, type User } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data } = await supabase
            .from('users')
            .select('id, email, full_name, organization_id, is_admin, avatar_url, created_at, updated_at')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session?.user) {
            const { data } = await supabase
              .from('users')
              .select('id, email, full_name, organization_id, is_admin, avatar_url, created_at, updated_at')
              .eq('id', session.user.id)
              .maybeSingle();

            setUser(data);
          } else {
            setUser(null);
          }
        })();
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, planId: string = 'free') => {
    try {
      setError(null);
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });

      if (signUpError) throw signUpError;

      if (authUser) {
        // Get or create default organization
        let orgId: string;
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', 'default')
          .maybeSingle();

        if (orgs) {
          orgId = orgs.id;
        } else {
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert([{
              name: 'StreamHub Default',
              slug: 'default',
              logo_url: '',
              description: 'Default organization'
            }])
            .select('id')
            .single();
          if (orgError) throw orgError;
          orgId = newOrg.id;
        }

        // Create user
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email,
            full_name: fullName,
            organization_id: orgId
          }]);

        if (insertError) throw insertError;

        // Get or create subscription plan
        let planIdToUse: string;
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('id')
          .eq('organization_id', orgId)
          .eq('name', planId.charAt(0).toUpperCase() + planId.slice(1))
          .maybeSingle();

        if (plan) {
          planIdToUse = plan.id;
        } else {
          // Create default plans if they don't exist
          const planConfigs = [
            { name: 'Free', max_credits: 10, price_monthly: 0 },
            { name: 'Basic', max_credits: 50, price_monthly: 9.90 },
            { name: 'Premium', max_credits: 200, price_monthly: 29.90 }
          ];

          const plansToCreate = planConfigs.map(pc => ({
            organization_id: orgId,
            ...pc
          }));

          const { data: createdPlans, error: plansError } = await supabase
            .from('subscription_plans')
            .insert(plansToCreate)
            .select('id, name');

          if (plansError) throw plansError;
          planIdToUse = createdPlans?.find(p => p.name.toLowerCase() === planId)?.id || createdPlans?.[0]?.id || '';
        }

        // Create subscription
        const { error: subError } = await supabase
          .from('user_subscriptions')
          .insert([{
            user_id: authUser.id,
            plan_id: planIdToUse,
            organization_id: orgId,
            status: 'active',
            current_credits: planId === 'free' ? 10 : planId === 'basic' ? 50 : 200,
            monthly_credits_limit: planId === 'free' ? 10 : planId === 'basic' ? 50 : 200
          }]);

        if (subError) throw subError;
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user
  };
}
