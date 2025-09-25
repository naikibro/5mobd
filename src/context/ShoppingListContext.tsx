import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ingredient } from "../types/navigation";

interface ShoppingItem extends Ingredient {
  quantity: number;
  addedAt: string;
}

interface ShoppingListContextType {
  shoppingList: ShoppingItem[];
  addItem: (item: Ingredient) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(
  undefined
);

interface ShoppingListProviderProps {
  children: ReactNode;
}

export const ShoppingListProvider: React.FC<ShoppingListProviderProps> = ({
  children,
}) => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const addItem = (item: Ingredient) => {
    setShoppingList((prevList) => {
      const existingItem = prevList.find((listItem) => listItem.id === item.id);
      if (existingItem) {
        // If item exists, increase quantity
        return prevList.map((listItem) =>
          listItem.id === item.id
            ? { ...listItem, quantity: listItem.quantity + 1 }
            : listItem
        );
      } else {
        // Add new item with quantity 1
        const newItem: ShoppingItem = {
          ...item,
          quantity: 1,
          addedAt: new Date().toISOString(),
        };
        return [...prevList, newItem];
      }
    });
  };

  const removeItem = (itemId: number) => {
    setShoppingList((prevList) =>
      prevList.filter((item) => item.id !== itemId)
    );
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setShoppingList((prevList) =>
        prevList.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Load from AsyncStorage on app start
  useEffect(() => {
    const loadShoppingList = async () => {
      try {
        const savedList = await AsyncStorage.getItem("shoppingList");
        if (savedList) {
          setShoppingList(JSON.parse(savedList));
        }
      } catch (error) {
        console.error("Error loading shopping list:", error);
      }
    };
    loadShoppingList();
  }, []);

  // Save to AsyncStorage whenever shopping list changes
  useEffect(() => {
    const saveShoppingList = async () => {
      try {
        await AsyncStorage.setItem(
          "shoppingList",
          JSON.stringify(shoppingList)
        );
      } catch (error) {
        console.error("Error saving shopping list:", error);
      }
    };
    saveShoppingList();
  }, [shoppingList]);

  return (
    <ShoppingListContext.Provider
      value={{ shoppingList, addItem, removeItem, updateQuantity }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error(
      "useShoppingList must be used within a ShoppingListProvider"
    );
  }
  return context;
};
