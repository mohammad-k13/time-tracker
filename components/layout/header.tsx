'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Clock, BarChart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function Header() {
      const router = useRouter();
      const { toast } = useToast();
      const supabase = getSupabaseClient();

      const handleSignOut = async () => {
            try {
                  await supabase.auth.signOut();
                  toast({
                        title: 'Signed out',
                        description: 'You have been signed out successfully.',
                  });
                  router.push('/login');
                  router.refresh();
            } catch (error: any) {
                  toast({
                        title: 'Error',
                        description: error.message || 'Failed to sign out.',
                        variant: 'destructive',
                  });
            }
      };

      return (
            <header className="border-b">
                  <div className="container flex flex-col md:flex-row md:items-center py-4 md:py-0 md:h-16">
                        <div className="flex items-center justify-between">
                              <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                                    <Clock className="h-6 w-6 text-primary" />
                                    <span className="text-xl">TimeTracker</span>
                              </Link>

                              <Button variant="ghost" size="sm" onClick={handleSignOut} className="md:hidden">
                                    <LogOut className="h-4 w-4" />
                              </Button>
                        </div>

                        <nav className="flex mt-4 md:mt-0 md:ml-8 space-x-4">
                              <Link
                                    href="/dashboard"
                                    className="text-sm font-medium px-3 py-1 rounded-md hover:bg-accent transition-colors"
                              >
                                    Dashboard
                              </Link>
                              <Link
                                    href="/reports"
                                    className="text-sm font-medium px-3 py-1 rounded-md hover:bg-accent transition-colors"
                              >
                                    <BarChart className="inline h-4 w-4 mr-1" />
                                    Reports
                              </Link>
                        </nav>

                        <div className="hidden md:block ml-auto">
                              <Button variant="ghost" onClick={handleSignOut}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                              </Button>
                        </div>
                  </div>
            </header>
      );
}
