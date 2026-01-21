import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { clerkPublishableKey } from '@/lib/convex';

/**
 * Auth context that uses Clerk when configured, otherwise falls back to mock auth.
 * Maintains the same interface for the rest of the app.
 */

interface User {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
  created_at: string;
}

interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clerk-based auth provider
function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut: clerkSignOut, openSignIn, openSignUp } = useClerk();
  const { getToken } = useClerkAuth();
  
  // Ensure profile exists in Convex when user signs in
  const ensureProfile = useMutation(api.auth.ensureProfile);
  
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const loading = !isLoaded;

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      // Map Clerk user to our User interface
      const mappedUser: User = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        app_metadata: {},
        user_metadata: {
          display_name: clerkUser.fullName || clerkUser.firstName || '',
          avatar_url: clerkUser.imageUrl,
        },
        aud: 'authenticated',
        created_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
      };
      setUser(mappedUser);

      // Create mock session
      getToken().then((token) => {
        if (token) {
          setSession({
            access_token: token,
            refresh_token: '',
            expires_in: 3600,
            expires_at: Date.now() + 3600000,
            token_type: 'Bearer',
            user: mappedUser,
          });
        }
      });

      // Ensure profile exists in Convex
      ensureProfile().catch(console.error);
    } else if (isLoaded && !isSignedIn) {
      setUser(null);
      setSession(null);
    }
  }, [isLoaded, isSignedIn, clerkUser, getToken, ensureProfile]);

  const signUp = async (_email: string, _password: string, _displayName?: string) => {
    try {
      openSignUp();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (_email: string, _password: string) => {
    try {
      openSignIn();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      openSignIn();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Mock auth provider for development without Clerk
function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check - auto login for development
    const mockUser: User = {
      id: 'mock-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: { display_name: 'Mock User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    
    setUser(mockUser);
    setSession({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
      user: mockUser,
    });
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, displayName?: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      app_metadata: {},
      user_metadata: { display_name: displayName || email.split('@')[0] },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    setSession({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
      user: newUser,
    });
    return { error: null };
  };

  const signIn = async (email: string, _password: string) => {
    const newUser: User = {
      id: 'mock-user-id',
      email,
      app_metadata: {},
      user_metadata: { display_name: email.split('@')[0] },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    setSession({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'Bearer',
      user: newUser,
    });
    return { error: null };
  };

  const signInWithGoogle = async () => {
    return signIn('google@example.com', 'password');
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// Main AuthProvider that chooses between Clerk and Mock
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasClerk = Boolean(clerkPublishableKey);

  if (hasClerk) {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }

  return <MockAuthProvider>{children}</MockAuthProvider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
