'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wallet, Plus, Minus, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WalletTransaction {
      id: string;
      amount: number;
      type: 'credit' | 'debit';
      note: string | null;
      created_at: string;
}

interface WalletPanelProps {
      totalEarnings: number;
}

export function WalletPanel({ totalEarnings }: WalletPanelProps) {
      const [balance, setBalance] = useState<number>(0);
      const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
      const [amount, setAmount] = useState<string>('');
      const [note, setNote] = useState<string>('');
      const [loading, setLoading] = useState(true);
      const [adding, setAdding] = useState(false);
      const supabase = getSupabaseClient();
      const { toast } = useToast();

      const fetchWallet = useCallback(async (uid: string) => {
            const [walletRes, txRes] = await Promise.all([
                  supabase.from('wallet').select('balance').eq('user_id', uid).single(),
                  supabase
                        .from('wallet_transactions')
                        .select('*')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })
                        .limit(15),
            ]);

            if (walletRes.data) setBalance(Number(walletRes.data.balance));
            if (txRes.data) setTransactions(txRes.data as WalletTransaction[]);
            setLoading(false);
      }, [supabase]);

      useEffect(() => {
            const init = async () => {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;
                  fetchWallet(user.id);
            };
            init();
      }, [supabase, fetchWallet]);

      const handleAddCredit = async () => {
            const parsed = parseInt(amount.replace(/[^0-9]/g, ''), 10);
            if (isNaN(parsed) || parsed <= 0) {
                  toast({ title: 'مبلغ نامعتبر', description: 'یک عدد مثبت وارد کنید.', variant: 'destructive' });
                  return;
            }

            setAdding(true);
            try {
                  const {
                        data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) throw new Error('Not authenticated');

                  // Upsert wallet balance
                  const newBalance = balance + parsed;
                  const { error: walletError } = await supabase
                        .from('wallet')
                        .upsert(
                              { user_id: user.id, balance: newBalance, updated_at: new Date().toISOString() },
                              { onConflict: 'user_id' },
                        );
                  if (walletError) throw walletError;

                  // Add transaction record
                  const { error: txError } = await supabase.from('wallet_transactions').insert({
                        user_id: user.id,
                        amount: parsed,
                        type: 'credit',
                        note: note || 'شارژ توسط مدیر',
                  });
                  if (txError) throw txError;

                  setBalance(newBalance);
                  setAmount('');
                  setNote('');
                  toast({ title: 'کیف پول شارژ شد', description: `${parsed.toLocaleString('fa-IR')} تومان اضافه شد.` });
                  fetchWallet(user.id);
            } catch (err: any) {
                  toast({ title: 'خطا', description: err.message, variant: 'destructive' });
            } finally {
                  setAdding(false);
            }
      };

      const netBalance = balance - totalEarnings;
      const isNegative = netBalance < 0;

      if (loading) {
            return (
                  <Card className="w-full max-w-2xl mx-auto">
                        <CardContent className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </CardContent>
                  </Card>
            );
      }

      return (
            <Card className="w-full max-w-2xl mx-auto">
                  <CardHeader>
                        <div className="flex items-center gap-2">
                              <Wallet className="h-5 w-5 text-primary" />
                              <CardTitle>کیف پول</CardTitle>
                        </div>
                        <CardDescription>مبلغ واریزی مدیر را وارد کنید</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                        {/* Balance summary */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                              <div className="rounded-lg border p-3 flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">موجودی واریزی</span>
                                    <span className="font-bold text-lg text-foreground">
                                          {balance.toLocaleString('fa-IR')}
                                          <span className="text-xs font-normal mr-1">ت</span>
                                    </span>
                              </div>
                              <div className="rounded-lg border p-3 flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">دستمزد کل</span>
                                    <span className="font-bold text-lg text-foreground">
                                          {totalEarnings.toLocaleString('fa-IR')}
                                          <span className="text-xs font-normal mr-1">ت</span>
                                    </span>
                              </div>
                              <div className="rounded-lg border p-3 flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground">مانده</span>
                                    <span
                                          className={`font-bold text-lg ${
                                                isNegative ? 'text-destructive' : 'text-green-600'
                                          }`}
                                    >
                                          {isNegative ? '' : '+'}
                                          {netBalance.toLocaleString('fa-IR')}
                                          <span className="text-xs font-normal mr-1">ت</span>
                                    </span>
                              </div>
                        </div>

                        {isNegative && (
                              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
                                    <Minus className="h-4 w-4 shrink-0" />
                                    <span>
                                          مدیر <strong>{Math.abs(netBalance).toLocaleString('fa-IR')} تومان</strong> بیشتر از موجودی کیف پول بدهکار است.
                                    </span>
                              </div>
                        )}

                        <Separator />

                        {/* Add credit form */}
                        <div className="space-y-3">
                              <Label className="text-sm font-medium">افزودن مبلغ واریزی جدید</Label>
                              <div className="flex gap-3">
                                    <div className="relative flex-1">
                                          <Input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="مبلغ (تومان)"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
                                                className="text-left"
                                                dir="ltr"
                                          />
                                    </div>
                                    <Input
                                          type="text"
                                          placeholder="توضیح (اختیاری)"
                                          value={note}
                                          onChange={(e) => setNote(e.target.value)}
                                          className="flex-1"
                                    />
                                    <Button onClick={handleAddCredit} disabled={adding || !amount}>
                                          <Plus className="mr-2 h-4 w-4" />
                                          افزودن
                                    </Button>
                              </div>
                        </div>

                        {/* Transaction history */}
                        {transactions.length > 0 && (
                              <div className="space-y-2">
                                    <Label className="text-sm font-medium">تاریخچه تراکنش‌ها</Label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                          {transactions.map((tx) => (
                                                <div
                                                      key={tx.id}
                                                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                                                >
                                                      <div className="flex items-center gap-2">
                                                            {tx.type === 'credit' ? (
                                                                  <ArrowDownCircle className="h-4 w-4 text-green-500 shrink-0" />
                                                            ) : (
                                                                  <ArrowUpCircle className="h-4 w-4 text-destructive shrink-0" />
                                                            )}
                                                            <span className="text-muted-foreground">
                                                                  {tx.note || (tx.type === 'credit' ? 'واریز' : 'برداشت')}
                                                            </span>
                                                      </div>
                                                      <div className="flex items-center gap-3">
                                                            <span
                                                                  className={`font-mono font-medium ${
                                                                        tx.type === 'credit'
                                                                              ? 'text-green-600'
                                                                              : 'text-destructive'
                                                                  }`}
                                                            >
                                                                  {tx.type === 'credit' ? '+' : '-'}
                                                                  {Number(tx.amount).toLocaleString('fa-IR')}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                  {formatDistanceToNow(new Date(tx.created_at), {
                                                                        addSuffix: true,
                                                                  })}
                                                            </span>
                                                      </div>
                                                </div>
                                          ))}
                                    </div>
                              </div>
                        )}
                  </CardContent>
            </Card>
      );
}
