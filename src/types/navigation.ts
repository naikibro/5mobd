export interface Ingredient {
  id: number;
  name: string;
  description: string;
  price: number;
  weight: number;
  category: string;
  origin: string;
}

export type RootStackParamList = {
  IngredientsList: undefined;
  IngredientDetails: { ingredient: Ingredient };
};
