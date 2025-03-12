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
    // Configure Amplify with your Cognito settings
    // These values should be stored in environment variables in production
    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolId: process.env.REACT_APP_USER_POOL_ID || '',
          userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '',
          loginWith: {
            oauth: {
              domain: process.env.REACT_APP_COGNITO_DOMAIN || '',
              scopes: ['email', 'profile', 'openid'],
              redirectSignIn: [process.env.REACT_APP_REDIRECT_SIGN_IN || window.location.origin],
              redirectSignOut: [process.env.REACT_APP_REDIRECT_SIGN_OUT || window.location.origin],
              responseType: 'code'
            }
          }
        }
      }
    });

    // Check if user is already signed in
    checkUser();

    // Set up Hub listener for auth events
    const listener = (data: any) => {
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
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      
      if (idToken) {
        const attributes = idToken.payload;
        setUser({
          username: currentUser.username,
          email: attributes.email as string,
          sub: attributes.sub as string,
          name: attributes.name as string | undefined,
          picture: attributes.picture as string | undefined,
        });
        setError(null);
      }
    } catch (error) {
      console.log('No authenticated user', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithRedirect({ provider: 'Google' });
    } catch (error) {
      console.error('Error signing in with Google', error);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  // Function to sign out
  const signOutUser = async () => {
    try {
      await signOut();
      setUser(null);
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