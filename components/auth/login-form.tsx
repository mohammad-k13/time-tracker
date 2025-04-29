'use client';

import type React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [showPassword, setShowPassword] = useState(false);
      const [isLoading, setIsLoading] = useState(false);
      const router = useRouter();
      const { toast } = useToast();
      const supabase = getSupabaseClient();

      const handleLogin = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            try {
                  const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                  });

                  if (error) {
                        throw error;
                  }

                  toast({
                        title: 'Login successful',
                        description: 'Welcome back!',
                  });

                  router.push('/dashboard');
                  router.refresh();
            } catch (error: any) {
                  toast({
                        title: 'Login failed',
                        description: error.message || 'Please check your credentials and try again.',
                        variant: 'destructive',
                  });
            } finally {
                  setIsLoading(false);
            }
      };

      return (
            <Card className="w-full max-w-md mx-auto">
                  <CardHeader>
                        <CardTitle className="text-2xl text-center">Login</CardTitle>
                        <CardDescription className="text-center">
                              Enter your credentials to access your account
                        </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                              <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                          id="email"
                                          type="email"
                                          placeholder="name@example.com"
                                          value={email}
                                          onChange={(e) => setEmail(e.target.value)}
                                          required
                                          disabled={isLoading}
                                    />
                              </div>
                              <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                          <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                disabled={isLoading}
                                          />
                                          <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={isLoading}
                                          >
                                                {showPassword ? (
                                                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                      <Eye className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="sr-only">
                                                      {showPassword ? 'Hide password' : 'Show password'}
                                                </span>
                                          </Button>
                                    </div>
                              </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                              <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                          <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Logging in...
                                          </>
                                    ) : (
                                          'Login'
                                    )}
                              </Button>
                              <div className="text-center text-sm">
                                    Don&apos;t have an account?{' '}
                                    <Link href="/signup" className="text-primary hover:underline">
                                          Sign up
                                    </Link>
                              </div>
                        </CardFooter>
                  </form>
            </Card>
      );
}
