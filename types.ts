export type CategoryRecord = {
  id: string;
  name: string;
  icon: string | null;
  user_id: string | null;
  created_at: string;
};

export type ItemRecord = {
  id: string;
  name: string;
  category_id: string;
  quantity: string | null;
  price: string | null;
  completed: boolean;
  position: number;
  user_id: string | null;
  created_at: string;
};
