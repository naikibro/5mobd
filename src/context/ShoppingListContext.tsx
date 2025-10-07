import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "./AuthContext";
import { Ingredient } from "../types/navigation";

interface ShoppingItem extends Ingredient {
  quantity: number;
  addedAt: string;
  firestoreId?: string;
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
  const { user } = useAuth();

  const addItem = async (item: Ingredient) => {
    if (!user) return;

    try {
      const existingItem = shoppingList.find(
        (listItem) => listItem.id === item.id
      );

      if (existingItem && existingItem.firestoreId) {
        // Update quantity in Firestore
        const itemRef = doc(db, "shoppingList", existingItem.firestoreId);
        const newQuantity = existingItem.quantity + 1;
        await updateDoc(itemRef, { quantity: newQuantity });

        setShoppingList((prevList) =>
          prevList.map((listItem) =>
            listItem.id === item.id
              ? { ...listItem, quantity: newQuantity }
              : listItem
          )
        );
      } else {
        // Add new item to Firestore
        const newItem = {
          ...item,
          quantity: 1,
          addedAt: new Date().toISOString(),
          userId: user.uid,
        };
        const docRef = await addDoc(collection(db, "shoppingList"), newItem);

        setShoppingList((prevList) => [
          ...prevList,
          { ...newItem, firestoreId: docRef.id },
        ]);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const removeItem = async (itemId: number) => {
    if (!user) return;

    try {
      const item = shoppingList.find((listItem) => listItem.id === itemId);
      if (item?.firestoreId) {
        await deleteDoc(doc(db, "shoppingList", item.firestoreId));
        setShoppingList((prevList) =>
          prevList.filter((listItem) => listItem.id !== itemId)
        );
      }
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeItem(itemId);
    } else {
      try {
        const item = shoppingList.find((listItem) => listItem.id === itemId);
        if (item?.firestoreId) {
          const itemRef = doc(db, "shoppingList", item.firestoreId);
          await updateDoc(itemRef, { quantity });

          setShoppingList((prevList) =>
            prevList.map((listItem) =>
              listItem.id === itemId ? { ...listItem, quantity } : listItem
            )
          );
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
      }
    }
  };

  // Load from Firestore when user changes
  useEffect(() => {
    const loadShoppingList = async () => {
      if (!user) {
        setShoppingList([]);
        return;
      }

      try {
        const q = query(
          collection(db, "shoppingList"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const items: ShoppingItem[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          items.push({
            id: data.id,
            name: data.name,
            category: data.category,
            price: data.price,
            description: data.description,
            weight: data.weight,
            origin: data.origin,
            quantity: data.quantity,
            addedAt: data.addedAt,
            firestoreId: doc.id,
          });
        });

        setShoppingList(items);
      } catch (error) {
        console.error("Error loading shopping list:", error);
      }
    };

    loadShoppingList();
  }, [user]);

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
