'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import {
  ArrowArcLeft,
  Check,
  Coins,
  ListBullets,
  Receipt,
  ShoppingBag,
  Plus,
  Trash,
} from '@phosphor-icons/react';

type EntryType = 'grocery' | 'expense';
type EntryFilter = 'all' | EntryType | 'completed';

type TrackerEntry = {
  id: string;
  user_id?: string | null;
  name: string;
  type: EntryType;
  category: string;
  quantity: number;
  amount: number;
  purchased: boolean;
  createdAt: string;
};

const groceryCategories = ['Produce', 'Pantry', 'Dairy', 'Bakery', 'Snacks'];
const expenseCategories = ['Bills', 'Transport', 'Home', 'Health', 'Other'];
const storageKey = 'tiaan-grocery-tool-entries';

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
});

function formatMoney(value: number) {
  return currencyFormatter.format(value);
}

function formatQuantity(value: number) {
  return `${value} ${value === 1 ? 'unit' : 'units'}`;
}

export default function Tracker() {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [filter, setFilter] = useState<EntryFilter>('all');
  const [form, setForm] = useState({
    name: '',
    amount: '0.00',
    quantity: '1',
    type: 'grocery' as EntryType,
    category: groceryCategories[0],
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const loadLocalEntries = () => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      setEntries([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as TrackerEntry[];
      setEntries(parsed);
    } catch {
      setEntries([]);
    }
  };

  const persistLocalEntries = (nextEntries: TrackerEntry[]) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(nextEntries));
  };

  const loadEntries = async () => {
    if (!session) return;

    setLoading(true);
    const { data, error } = await supabaseClient
      .from('entries')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setEntries((data as TrackerEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { session: activeSession },
      } = await supabaseClient.auth.getSession();

      setSession(activeSession);
      if (activeSession) {
        await loadEntries();
      } else {
        loadLocalEntries();
        setLoading(false);
      }

      const { data: authListener } = supabaseClient.auth.onAuthStateChange(
        async (_event, authSession) => {
          setSession(authSession);

          if (authSession) {
            await loadEntries();
          } else {
            loadLocalEntries();
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    initialize();
  }, [supabaseClient]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    persistLocalEntries(entries);
  }, [entries]);

  const categoryOptions = form.type === 'grocery' ? groceryCategories : expenseCategories;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      category: current.type === 'grocery' ? groceryCategories[0] : expenseCategories[0],
    }));
  }, [form.type]);

  const visibleEntries = useMemo(() => {
    if (filter === 'completed') {
      return entries
        .filter((entry) => entry.purchased)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return entries
      .filter((entry) => !entry.purchased && (filter === 'all' || entry.type === filter))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [entries, filter]);

  const groceryEntries = useMemo(
    () => entries.filter((entry) => entry.type === 'grocery'),
    [entries]
  );
  const expenseEntries = useMemo(
    () => entries.filter((entry) => entry.type === 'expense'),
    [entries]
  );

  const groceryTotal = groceryEntries.reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  const expenseTotal = expenseEntries.reduce((sum, entry) => sum + entry.amount * entry.quantity, 0);
  const pendingCount = entries.filter((entry) => !entry.purchased).length;
  const completedCount = entries.filter((entry) => entry.purchased).length;
  const totalAmount = groceryTotal + expenseTotal;

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAddEntry = async () => {
    const trimmedName = form.name.trim();
    const amount = Number(form.amount) || 0;
    const quantity = Math.max(1, Number(form.quantity) || 1);

    if (!trimmedName || amount <= 0) {
      setMessage('Enter a name and an amount above 0.');
      return;
    }

    const nextEntry: TrackerEntry = {
      id: crypto.randomUUID(),
      user_id: session?.user.id ?? null,
      name: trimmedName,
      type: form.type,
      category: form.category,
      amount,
      quantity,
      purchased: false,
      createdAt: new Date().toISOString(),
    };

    if (session) {
      const { data, error } = await supabaseClient
        .from('entries')
        .insert({
          user_id: session.user.id,
          entry_type: form.type,
          name: trimmedName,
          category: form.category,
          quantity,
          amount,
          purchased: false,
        })
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setEntries((current) => [(data as TrackerEntry), ...current]);
    } else {
      setEntries((current) => [nextEntry, ...current]);
    }

    setForm((current) => ({
      ...current,
      name: '',
      amount: '0.00',
      quantity: '1',
    }));
  };

  const togglePurchased = async (id: string) => {
    const target = entries.find((entry) => entry.id === id);
    if (!target) return;

    if (session) {
      const { data, error } = await supabaseClient
        .from('entries')
        .update({ purchased: !target.purchased })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        setMessage(error.message);
        return;
      }

      setEntries((current) =>
        current.map((entry) => (entry.id === id ? (data as TrackerEntry) : entry))
      );
      return;
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, purchased: !entry.purchased } : entry
      )
    );
  };

  const removeEntry = async (id: string) => {
    if (session) {
      const { error } = await supabaseClient.from('entries').delete().eq('id', id);
      if (error) {
        setMessage(error.message);
        return;
      }
    }

    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('Enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Signed in. Loading synced entries...');
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage('Enter both email and password to sign up.');
      return;
    }

    setLoading(true);
    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Check your email for a confirmation link.');
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    setSession(null);
    setEntries([]);
    setMessage('Signed out. Local history remains until you sign in again.');
  };

  if (loading) {
    return (
      <section className="relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200/80 bg-white p-10 shadow-panel">
            <div className="h-6 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-10 grid gap-6">
              <div className="h-28 rounded-[1.5rem] bg-slate-100" />
              <div className="h-60 rounded-[1.5rem] bg-slate-100" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {!session && (
          <div className="mb-8 rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Sync with Supabase</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Sign in to sync across devices.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Use the same account on every device and keep your grocery list in the cloud. If you remain unsigned, the app will keep a local copy only.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleSignIn}
                  className="inline-flex h-12 items-center justify-center rounded-3xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  className="inline-flex h-12 items-center justify-center rounded-3xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Create account
                </button>
              </div>
            </div>
            {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white/95 p-8 shadow-soft backdrop-blur-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Tiaan's Grocery + Expense Tracker</p>
                  <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                    Fok die calculator en "ons het die grocery lys by die huis vergeet😂".
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                    Add each purchase, assign a category, and keep totals visible. Signed-in entries sync to Supabase so your list travels with you.
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50 p-4 text-sm text-slate-700 shadow-panel">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ListBullets weight="bold" size={24} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-950">Total tracked</p>
                    <p className="text-sm text-slate-500">{entries.length} entries</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <ShoppingBag weight="bold" size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Grocery total</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(groceryTotal)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <Coins weight="bold" size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Expense total</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(expenseTotal)}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Check weight="bold" size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Pending actions</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{pendingCount}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-soft">
                <div className="flex items-center gap-3 text-slate-700">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                    <Receipt weight="bold" size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total value</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(totalAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200/70 bg-slate-50/95 p-8 shadow-soft">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">New entry</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">Add a grocery or expense</h2>
              </div>
              <div className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/70">
                <Plus weight="bold" size={18} />
                <span className="ml-2">Quick add</span>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Item name
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder="Tomatoes, electricity, coffee"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) => handleChange('amount', event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Entry type
                  <select
                    value={form.type}
                    onChange={(event) => handleChange('type', event.target.value as EntryType)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="grocery">Grocery</option>
                    <option value="expense">Expense</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select
                    value={form.category}
                    onChange={(event) => handleChange('category', event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {form.type === 'grocery' && (
                <label className="block text-sm font-medium text-slate-700">
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.quantity}
                    onChange={(event) => handleChange('quantity', event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              )}

              <button
                type="button"
                onClick={handleAddEntry}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/15 transition hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-[0.99]"
              >
                <Plus weight="bold" size={18} />
                Add entry
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-slate-200/70 bg-white/95 p-6 shadow-soft">
          <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Your list</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Recent grocery and expense entries</h2>
            </div>
            <div className="inline-flex gap-2 rounded-full bg-slate-100 p-2 text-sm text-slate-700">
              {(['all', 'grocery', 'expense', 'completed'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 transition ${
                    filter === option
                      ? 'bg-emerald-600 text-white shadow-soft'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {option === 'all'
                    ? 'All'
                    : option === 'grocery'
                    ? 'Grocery'
                    : option === 'expense'
                    ? 'Expenses'
                    : 'Checked off'}
                </button>
              ))}
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-950">No entries yet</p>
              <p className="mt-2 max-w-xl mx-auto text-sm leading-6">
                Add your first grocery item or expense to track totals instantly. Signed-in entries sync across devices.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4">
              {visibleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`group flex flex-col gap-4 rounded-[1.75rem] border border-slate-200/70 p-5 transition ${
                    entry.purchased
                      ? 'bg-slate-100 opacity-80'
                      : 'bg-slate-50 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                          {entry.type === 'grocery' ? <ShoppingBag size={16} /> : <Coins size={16} />}
                          {entry.type === 'grocery' ? 'Grocery' : 'Expense'}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                          <Receipt size={16} />
                          {entry.category}
                        </span>
                      </div>
                      <h3 className={`text-xl font-semibold ${entry.purchased ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-950'}`}>
                        {entry.name}
                      </h3>
                      <p className={`text-sm ${entry.purchased ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-600'}`}>
                        {entry.quantity > 1 ? `${formatQuantity(entry.quantity)} · ` : ''}
                        {formatMoney(entry.amount * entry.quantity)}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => togglePurchased(entry.id)}
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition active:scale-[0.98] ${
                          entry.purchased
                            ? 'hover:bg-slate-100 hover:text-slate-900'
                            : 'hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        aria-label={entry.purchased ? 'Mark as not purchased' : 'Mark as purchased'}
                      >
                        {entry.purchased ? (
                          <ArrowArcLeft weight="bold" size={18} />
                        ) : (
                          <Check weight="bold" size={18} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-rose-700 active:scale-[0.98]"
                        aria-label="Delete entry"
                      >
                        <Trash weight="bold" size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{new Date(entry.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
                    <span>{entry.purchased ? 'Completed' : 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
