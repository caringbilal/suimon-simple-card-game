import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signInWithRedirect, signOut, getCurrentUser } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';

// Define the shape of the user object
interface User {
  username: string;
  email: string;
  picture?: string;
  sub: string; // Cognito user ID
  name?: string;
}

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  error: null,
});

// Define props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure Amplify when the component mounts
  useEffect(() => {
    // Trying to print below environment variables
    console.log('User Pool ID:', process.env.REACT_APP_USER_POOL_ID);
    console.log('User Pool Client ID:', process.env.REACT_APP_USER_POOL_CLIENT_ID);
    console.log('Cognito Domain:', process.env.REACT_APP_COGNITO_DOMAIN);
    console.log('Redirect Sign In:', process.env.REACT_APP_REDIRECT_SIGN_IN);
    console.log('Redirect Sign Out:', process.env.REACT_APP_REDIRECT_SIGN_OUT);

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
          userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
          loginWith: {
            oauth: {
              domain: process.env.REACT_APP_COGNITO_DOMAIN || '',
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3005'],
              redirectSignOut: [process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3005'],
              responseType: 'code'
            }
          }
        }
      }
    });

    // Check if user is already signed in
    checkUser();

    // Set up Hub listener for auth events
    const listener = (data: { payload: { event: string; data?: any } }) => {
      switch (data.payload.event) {
        case 'signIn':
          console.log('User signed in');
          checkUser();
          break;
        case 'signOut':
          console.log('User signed out');
          setUser(null);
          break;
        case 'signIn_failure':
          console.error('Sign in failure', data.payload.data);
          setError('Sign in failed. Please try again.');
          break;
      }
    };

    const unsubscribe = Hub.listen('auth', listener);

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // Function to check if a user is authenticated
  const checkUser = async () => {
    setIsLoading(true);
    try {
      console.log('Checking user authentication...');
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      
      if (idToken) {
        const attributes = idToken.payload;
        if (!attributes.sub || !attributes.email) {
          throw new Error('Required user attributes are missing');
        }
        setUser({
          username: currentUser.username,
          email: attributes.email as string,
          sub: attributes.sub as string,
          name: (attributes.name as string) || undefined,
          picture: (attributes.picture as string) || undefined,
        });
        console.log('User authenticated:', currentUser.username);
        setError(null);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setUser(null);
      setError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('Attempting to sign in with Google...');
      setError(null);
      await signInWithRedirect({ provider: 'Google' });
      console.log('Redirecting to Google sign-in...');
    } catch (error) {
      console.error('Error signing in with Google', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  // Function to sign out
  const signOutUser = async () => {
    try {
      console.log('Signing out user...');
      await signOut();
      setUser(null);
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signInWithGoogle,
        signOut: signOutUser,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);