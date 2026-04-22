'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Coffee,
  Droplet,
  Drumstick,
  Edit3,
  GripVertical,
  Leaf,
  Moon,
  Plus,
  Save,
  Search,
  Sparkles,
  Sun,
  Trash2,
  FlaskConical,
  ShoppingBag,
  Tag,
  ChevronRight,
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import type { CategoryRecord, ItemRecord } from '../types';
import type { Session, User } from '@supabase/supabase-js';
import { Badge } from '../components/ui/badge';
import { BottomSheet } from '../components/ui/bottom-sheet';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';

import { useLocalStorage } from '../hooks/use-local-storage';

const categoryIconMap = {
  Drumstick,
  Leaf,
  Droplet,
  FlaskConical,
  Coffee,
  ShoppingBag,
  Sparkles,
  Tag,
} as const;

type CategoryIconKey = keyof typeof categoryIconMap;

const categoryOptions: Array<{ value: CategoryIconKey; label: string }> = [
  { value: 'Drumstick', label: 'Meat' },
  { value: 'Leaf', label: 'Vegetables' },
  { value: 'Droplet', label: 'Cleaning' },
  { value: 'FlaskConical', label: 'Sauces' },
  { value: 'Coffee', label: 'Beverage' },
  { value: 'ShoppingBag', label: 'Pantry' },
  { value: 'Sparkles', label: 'Fresh' },
  { value: 'Tag', label: 'Other' },
];

const seedCategories = [
  { name: 'Meat', icon: 'Drumstick' },
  { name: 'Vegetables', icon: 'Leaf' },
  { name: 'Cleaning Supplies', icon: 'Droplet' },
  { name: 'Sauces', icon: 'FlaskConical' },
];

const currencyFormatter = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 2,
});

function formatPrice(value: string | null) {
  if (!value) return null;
  const numberValue = Number(value.replace(',', '.'));
  if (Number.isNaN(numberValue)) return null;
  return currencyFormatter.format(numberValue);
}

function CategoryIcon({ icon, className = 'h-4 w-4' }: { icon: string | null; className?: string }) {
  const Icon = icon && (categoryIconMap as Record<string, typeof Tag>)[icon] ? (categoryIconMap as Record<string, typeof Tag>)[icon] : Tag;
  return <Icon className={className} />;
}

function SortableItemRow({
  item,
  categoryName,
  onToggle,
  onEdit,
  onDelete,
  onAction,
  onMoveUp,
  onMoveDown,
}: {
  item: ItemRecord;
  categoryName: string;
  onToggle: (item: ItemRecord) => void;
  onEdit: (item: ItemRecord) => void;
  onDelete: (item: ItemRecord) => void;
  onAction: (item: ItemRecord) => void;
  onMoveUp: (item: ItemRecord) => void;
  onMoveDown: (item: ItemRecord) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const [longPress, setLongPress] = useState<number | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startLongPress = () => {
    const timeout = window.setTimeout(() => onAction(item), 550);
    setLongPress(timeout);
  };

  const cancelLongPress = () => {
    if (longPress) {
      window.clearTimeout(longPress);
      setLongPress(null);
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-950"
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onTouchEnd={cancelLongPress}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggle(item)}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border transition ${
            item.completed ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-slate-100'
          } dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300`}
          aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          <CheckCircle2 className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            <span>{categoryName || 'Other'}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>{item.quantity ? `${item.quantity} pcs` : 'No quantity'}</span>
            {item.price ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>{formatPrice(item.price)}</span>
              </>
            ) : null}
          </div>
          <p className={`mt-2 text-sm font-semibold ${item.completed ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-950 dark:text-slate-100'}`}>{item.name}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-2xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => onMoveUp(item)} aria-label="Move up">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" className="rounded-2xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => onMoveDown(item)} aria-label="Move down">
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button type="button" {...attributes} {...listeners} className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Drag item">
              <GripVertical className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onEdit(item)} className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Edit item">
              <Edit3 className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => onDelete(item)} className="rounded-2xl bg-slate-100 p-2 text-slate-500 transition hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-400" aria-label="Delete item">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function arrayMove<T>(array: T[], from: number, to: number) {
  const next = [...array];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSheet, setActiveSheet] = useState<'add-item' | 'edit-item' | 'category-add' | 'item-actions' | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRecord | null>(null);
  const [actionTarget, setActionTarget] = useState<ItemRecord | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRecord | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('grocery-theme', 'light');

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [itemForm, setItemForm] = useState({ name: '', category_id: '', quantity: '', price: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'Tag' as CategoryIconKey });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const groupedCategories = useMemo(() => {
    const grouped = categories.map((category) => ({
      category,
      items: items.filter((item) => item.category_id === category.id).sort((a, b) => a.position - b.position),
    }));
    const uncategorizedItems = items.filter((item) => !categories.some((category) => category.id === item.category_id));
    if (uncategorizedItems.length > 0) {
      grouped.push({
        category: { id: 'uncategorized', name: 'Other', icon: 'Tag', user_id: null, created_at: new Date().toISOString() },
        items: uncategorizedItems.sort((a, b) => a.position - b.position),
      });
    }
    return grouped;
  }, [categories, items]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setItems([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data: existingCategories } = await supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
        if (!existingCategories || existingCategories.length === 0) {
          await supabase.from('categories').insert(seedCategories.map((category) => ({ ...category, user_id: user.id })));
        }
        const [{ data: categoriesData }, { data: itemsData }] = await Promise.all([
          supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
          supabase.from('items').select('*').eq('user_id', user.id).order('position', { ascending: true }),
        ]);
        setCategories(categoriesData ?? []);
        setItems(itemsData ?? []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('grocery-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        supabase
          .from('items')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true })
          .then((result) => {
            if (result.data) setItems(result.data);
          });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).then((result) => {
          if (result.data) setCategories(result.data);
        });
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (categories.length > 0) {
      setCollapsed((prev) => {
        const next = { ...prev };
        categories.forEach((category) => {
          if (next[category.id] === undefined) {
            next[category.id] = false;
          }
        });
        return next;
      });
    }
  }, [categories]);

  const updatePositions = async (sectionItems: ItemRecord[], mergedItems?: ItemRecord[]) => {
    if (mergedItems) {
      setItems(mergedItems);
    } else {
      setItems((current) => {
        const map = new Map(sectionItems.map((item) => [item.id, item]));
        return current.map((item) => map.get(item.id) ?? item);
      });
    }
    await supabase.from('items').upsert(sectionItems.map((item) => ({ id: item.id, position: item.position })), { onConflict: 'id', ignoreDuplicates: false });
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const email = authForm.email.trim();
    const password = authForm.password;

    if (!email || !password) {
      setAuthError('Enter both email and password.');
      setAuthLoading(false);
      return;
    }

    try {
      if (authView === 'sign-up') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Account created. Check your email for confirmation.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to authenticate.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  const handleToggleAuthView = () => {
    setAuthView((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
    setAuthError(null);
    setAuthMessage(null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeItem = items.find((item) => item.id === active.id);
    const overItem = items.find((item) => item.id === over.id);
    if (!activeItem || !overItem || activeItem.category_id !== overItem.category_id) return;

    const categoryItems = items.filter((item) => item.category_id === activeItem.category_id).sort((a, b) => a.position - b.position);
    const activeIndex = categoryItems.findIndex((item) => item.id === active.id);
    const overIndex = categoryItems.findIndex((item) => item.id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;

    const nextSection = arrayMove(categoryItems, activeIndex, overIndex).map((item, index) => ({ ...item, position: index }));
    const mergedItems = items.map((item) => nextSection.find((sectionItem) => sectionItem.id === item.id) ?? item);
    await updatePositions(nextSection, mergedItems);
  };

  const saveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const categoryId = itemForm.category_id || categories[0]?.id;
    if (!user || !itemForm.name.trim() || !categoryId) return;

    if (selectedItem) {
      const nextItem: ItemRecord = {
        ...selectedItem,
        name: itemForm.name.trim(),
        quantity: itemForm.quantity.trim() || null,
        price: itemForm.price.trim() || null,
        category_id: categoryId,
      };
      const { error } = await supabase.from('items').update(nextItem).eq('id', selectedItem.id);
      if (!error) {
        setItems((current) => current.map((item) => (item.id === selectedItem.id ? nextItem : item)));
        setSelectedItem(null);
        setActiveSheet(null);
      }
      return;
    }

    const position = items.length > 0 ? Math.max(...items.map((item) => item.position)) + 1 : 0;
    const { data, error } = await supabase
      .from('items')
      .insert([{ name: itemForm.name.trim(), category_id: categoryId, quantity: itemForm.quantity.trim() || null, price: itemForm.price.trim() || null, completed: false, position, user_id: user.id }])
      .select()
      .single();
    if (!error && data) {
      setItems((current) => [...current, data]);
      setActiveSheet(null);
      setItemForm({ name: '', category_id: categoryId, quantity: '', price: '' });
    }
  };

  const saveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !categoryForm.name.trim()) return;
    const { data, error } = await supabase.from('categories').insert([{ name: categoryForm.name.trim(), icon: categoryForm.icon, user_id: user.id }]).select().single();
    if (!error && data) {
      setCategories((current) => [...current, data]);
      setCategoryForm({ name: '', icon: 'Tag' });
      setActiveSheet(null);
    }
  };

  const markComplete = async (item: ItemRecord) => {
    const nextItem = { ...item, completed: !item.completed };
    const { error } = await supabase.from('items').update({ completed: nextItem.completed }).eq('id', item.id);
    if (!error) {
      setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? nextItem : currentItem)));
    }
  };

  const beginEdit = (item: ItemRecord) => {
    setSelectedItem(item);
    setItemForm({ name: item.name, category_id: item.category_id, quantity: item.quantity ?? '', price: item.price ?? '' });
    setActiveSheet('edit-item');
  };

  const removeItem = async (item: ItemRecord) => {
    const confirmed = window.confirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) return;
    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (!error) {
      setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    }
  };

  const openActions = (item: ItemRecord) => {
    setActionTarget(item);
    setActiveSheet('item-actions');
  };

  const moveItem = async (item: ItemRecord, delta: -1 | 1) => {
    const sectionItems = items.filter((current) => current.category_id === item.category_id).sort((a, b) => a.position - b.position);
    const index = sectionItems.findIndex((current) => current.id === item.id);
    if (index === -1) return;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= sectionItems.length) return;
    const nextSection = arrayMove(sectionItems, index, targetIndex).map((nextItem, position) => ({ ...nextItem, position }));
    const mergedItems = items.map((current) => nextSection.find((sectionItem) => sectionItem.id === current.id) ?? current);
    await updatePositions(nextSection, mergedItems);
  };

  const moveItemToEdge = async (item: ItemRecord, toStart: boolean) => {
    const sectionItems = items.filter((current) => current.category_id === item.category_id).sort((a, b) => a.position - b.position);
    const index = sectionItems.findIndex((current) => current.id === item.id);
    if (index === -1) return;
    const targetIndex = toStart ? 0 : sectionItems.length - 1;
    if (index === targetIndex) return;
    const nextSection = arrayMove(sectionItems, index, targetIndex).map((nextItem, position) => ({ ...nextItem, position }));
    const mergedItems = items.map((current) => nextSection.find((sectionItem) => sectionItem.id === current.id) ?? current);
    await updatePositions(nextSection, mergedItems);
  };

  const moveItemToCategory = async (item: ItemRecord, categoryId: string) => {
    const nextItem = { ...item, category_id: categoryId };
    const { error } = await supabase.from('items').update({ category_id: categoryId }).eq('id', item.id);
    if (!error) {
      setItems((current) => current.map((currentItem) => (currentItem.id === item.id ? nextItem : currentItem)));
      setActiveSheet(null);
    }
  };

  const deleteCategory = async (category: CategoryRecord) => {
    const confirmed = window.confirm(`Delete category "${category.name}"? Items will move to the first available category.`);
    if (!confirmed) return;
    const fallback = categories.find((candidate) => candidate.id !== category.id);
    const updates = fallback ? { category_id: fallback.id } : undefined;
    if (updates && fallback) {
      await supabase.from('items').update(updates).eq('category_id', category.id);
      setItems((current) => current.map((item) => (item.category_id === category.id ? { ...item, category_id: fallback.id } : item)));
    }
    const { error } = await supabase.from('categories').delete().eq('id', category.id);
    if (!error) {
      setCategories((current) => current.filter((currentCategory) => currentCategory.id !== category.id));
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4">
          <div className="h-12 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-44 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950 sm:px-6">
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white px-6 py-8 shadow-soft dark:border-slate-700/60 dark:bg-slate-950">
          <div className="space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Grocery list</p>
            <h1 className="text-3xl font-semibold text-slate-950 dark:text-slate-100">Sign in to keep your list private.</h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">Use your email and password to save items to your own account.</p>
          </div>

          <form className="mt-8 space-y-4" onSubmit={handleAuthSubmit}>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Email</span>
              <Input value={authForm.email} onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))} type="email" placeholder="you@example.com" required />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Password</span>
              <Input value={authForm.password} onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))} type="password" placeholder="Enter a secure password" required />
            </label>

            {authError ? <p className="text-sm text-rose-600 dark:text-rose-400">{authError}</p> : null}
            {authMessage ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{authMessage}</p> : null}

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authView === 'sign-in' ? 'Sign in' : 'Create account'}
              </Button>
              <button type="button" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800" onClick={handleToggleAuthView}>
                {authView === 'sign-in' ? 'Create an account' : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4">
          <div className="h-12 rounded-3xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-80 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-44 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 rounded-[2rem] bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-700/60 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm uppercase tracking-[0.34em] text-slate-500 dark:text-slate-400">Grocery workflow</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">Clean groceries, built for fast mobile flow.</h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">Add categories, reorder by touch or buttons, and keep everything grouped in an elegant list that feels effortless.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="compact" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {theme === 'light' ? 'Dark mode' : 'Light mode'}
                </Button>
                <Button size="compact" onClick={() => { setSelectedItem(null); setItemForm({ name: '', category_id: categories[0]?.id || '', quantity: '', price: '' }); setActiveSheet('add-item'); }}>
                  <Plus className="h-4 w-4" />
                  Add item
                </Button>
                <Button variant="secondary" size="compact" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            </div>
          </div>

          <Card className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Current list</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Organized by category</h2>
              </div>
              <Button variant="secondary" size="compact" onClick={() => setActiveSheet('category-add')}>
                <Plus className="h-4 w-4" />
                New category
              </Button>
            </div>

            <div className="space-y-4">
              {groupedCategories.map(({ category, items: sectionItems }) => (
                <div key={category.id} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 text-left"
                    onClick={() => setCollapsed((prev) => ({ ...prev, [category.id]: !prev[category.id] }))}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-3xl bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100">
                        <CategoryIcon icon={category.icon} className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-slate-950 dark:text-slate-100">{category.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{sectionItems.length} item{sectionItems.length === 1 ? '' : 's'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {category.id !== 'uncategorized' ? (
                        <Button variant="ghost" size="compact" onClick={() => deleteCategory(category)}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      ) : null}
                      <ChevronDown className={`h-5 w-5 transition ${collapsed[category.id] ? 'rotate-180' : ''} text-slate-500 dark:text-slate-400`} />
                    </div>
                  </button>

                  {!collapsed[category.id] && (
                    <div className="mt-4">
                      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                        <SortableContext items={sectionItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                          <ul className="space-y-3">
                            {sectionItems.map((item) => (
                              <SortableItemRow
                                key={item.id}
                                item={item}
                                categoryName={category.name}
                                onToggle={markComplete}
                                onEdit={beginEdit}
                                onDelete={removeItem}
                                onAction={openActions}
                                onMoveUp={(selected) => moveItem(selected, -1)}
                                onMoveDown={(selected) => moveItem(selected, 1)}
                              />
                            ))}
                          </ul>
                        </SortableContext>
                      </DndContext>
                      {sectionItems.length === 0 ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No items in this category yet. Add one with the button above.</p> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Quick find</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">Search or sort</h2>
              </div>
              <span className="rounded-2xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">Mobile-first</span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-11" placeholder="Search items" disabled />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Touch-friendly controls</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  <li>• Drag items on supported devices.</li>
                  <li>• Use move buttons on mobile to reorder.</li>
                  <li>• Long-press a row for more options.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <div className="grid gap-3 rounded-[1.75rem] bg-slate-50 p-5 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-3xl bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Designed for</p>
                  <p className="text-base font-semibold text-slate-950 dark:text-slate-100">Comfortable daily shopping.</p>
                </div>
              </div>
              <div className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                <p>Keep the interface light, touch targets generous, and actions conveniently reachable.</p>
                <p>Floating add button and bottom sheets preserve the flow on phones.</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex max-w-6xl justify-center px-4 sm:static sm:px-0">
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-teal-700 sm:rounded-[2rem] sm:px-8" onClick={() => setActiveSheet('add-item')}>
          <Plus className="h-4 w-4" />
          Add grocery item
        </button>
      </div>

      <BottomSheet open={activeSheet === 'add-item'} title="New grocery item" description="Add a name, category and optional quantity." onClose={() => setActiveSheet(null)}>
        <form className="space-y-4" onSubmit={saveItem}>
          <div className="grid gap-4">
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Name</span>
              <Input value={itemForm.name} onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Spicy basil leaves" required />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Category</span>
              <Select value={itemForm.category_id || categories[0]?.id} onChange={(event) => setItemForm((prev) => ({ ...prev, category_id: event.target.value }))}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </Select>
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Quantity</span>
              <Input value={itemForm.quantity} onChange={(event) => setItemForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="Optional" />
            </label>
            <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <span>Price (R)</span>
              <Input value={itemForm.price} onChange={(event) => setItemForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="e.g. 45.50" />
            </label>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setActiveSheet(null)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save item
            </Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === 'edit-item'} title="Edit item" description="Update the item details." onClose={() => { setActiveSheet(null); setSelectedItem(null); }}>
        <form className="space-y-4" onSubmit={saveItem}>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Name</span>
            <Input value={itemForm.name} onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Lemon basil" required />
          </label>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Category</span>
            <Select value={itemForm.category_id || categories[0]?.id} onChange={(event) => setItemForm((prev) => ({ ...prev, category_id: event.target.value }))}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Select>
          </label>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Quantity</span>
            <Input value={itemForm.quantity} onChange={(event) => setItemForm((prev) => ({ ...prev, quantity: event.target.value }))} placeholder="Optional" />
          </label>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Price (R)</span>
            <Input value={itemForm.price} onChange={(event) => setItemForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="e.g. 45.50" />
          </label>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setActiveSheet(null); setSelectedItem(null); }}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Update item
            </Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === 'category-add'} title="New category" description="Create a custom category with an icon." onClose={() => setActiveSheet(null)}>
        <form className="space-y-4" onSubmit={saveCategory}>
          <label className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Name</span>
            <Input value={categoryForm.name} onChange={(event) => setCategoryForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="e.g. Snacks" required />
          </label>
          <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
            <span>Icon</span>
            <div className="grid grid-cols-4 gap-3">
              {categoryOptions.map((option) => {
                const Icon = categoryIconMap[option.value];
                return (
                  <button key={option.value} type="button" onClick={() => setCategoryForm((prev) => ({ ...prev, icon: option.value }))} className={`flex flex-col items-center justify-center rounded-3xl border px-3 py-3 text-xs transition ${categoryForm.icon === option.value ? 'border-accent bg-accent/10 text-accent' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500'}`}>
                    <Icon className="mb-1 h-5 w-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setActiveSheet(null)}>
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" />
              Create category
            </Button>
          </div>
        </form>
      </BottomSheet>

      <BottomSheet open={activeSheet === 'item-actions' && actionTarget !== null} title="Item actions" description="Move this item or change its category." onClose={() => { setActiveSheet(null); setActionTarget(null); }}>
        {actionTarget ? (
          <div className="space-y-4">
            <Button size="default" variant="secondary" type="button" className="w-full justify-start" onClick={() => { moveItemToEdge(actionTarget, true); setActiveSheet(null); setActionTarget(null); }}>
              <ArrowUp className="h-4 w-4" />
              Move to top
            </Button>
            <Button size="default" variant="secondary" type="button" className="w-full justify-start" onClick={() => { moveItemToEdge(actionTarget, false); setActiveSheet(null); setActionTarget(null); }}>
              <ArrowDown className="h-4 w-4" />
              Move to bottom
            </Button>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Move to category</p>
              <div className="mt-3 grid gap-3">
                {categories.map((category) => (
                  <button key={category.id} type="button" onClick={() => moveItemToCategory(actionTarget, category.id)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900">
                    <span className="flex items-center gap-2">
                      <CategoryIcon icon={category.icon} className="h-4 w-4" />
                      {category.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
