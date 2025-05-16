import React, { useState } from 'react';
import { Card, Input, Button } from '../components/ui';
import { EnvelopeIcon, KeyIcon, ArrowRightIcon, UserIcon } from '@heroicons/react/24/outline';

// Mock login component for development 
const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth attempt with:', { email, password, displayName });
    
    // Redirect to dashboard in development mode
    window.location.href = '/';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="font-medium text-primary-600 hover:text-primary-500"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <Input
                label="Display Name"
                type="text"
                id="displayName"
                placeholder="Your Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                fullWidth
                leftIcon={<UserIcon className="h-5 w-5" />}
              />
            )}
            
            <Input
              label="Email Address"
              type="email"
              id="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              leftIcon={<EnvelopeIcon className="h-5 w-5" />}
            />
            
            <Input
              label="Password"
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              leftIcon={<KeyIcon className="h-5 w-5" />}
            />
          </div>
          
          {!isSignUp && (
            <div className="flex items-center justify-end">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </a>
              </div>
            </div>
          )}
          
          <div>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              rightIcon={<ArrowRightIcon className="h-5 w-5" />}
            >
              {isSignUp ? 'Sign up' : 'Sign in'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
