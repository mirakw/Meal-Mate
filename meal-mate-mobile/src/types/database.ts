export interface Profile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  folder_id: string | null;
  title: string;
  url: string | null;
  servings: number;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  ingredients: string[];
  instructions: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  recipe_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  created_at: string;
}

export interface RecipeWithFolder extends Recipe {
  folder?: Folder;
}

export interface MealPlanWithRecipe extends MealPlan {
  recipe: Recipe;
}
