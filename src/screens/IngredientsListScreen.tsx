import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { RootStackParamList, Ingredient } from "../types/navigation";

const IngredientsListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ingredients"));
        const ingredientsList: Ingredient[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          ingredientsList.push({
            id: data.id || doc.id,
            name: data.name,
            description: data.description,
            price: data.price,
            weight: data.weight,
            origin: data.origin,
            category: data.category,
          });
        });
        setIngredients(ingredientsList);
      } catch (error) {
        console.error("Error fetching ingredients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  const renderIngredient = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() =>
        navigation.navigate("IngredientDetails", { ingredient: item })
      }
    >
      <View style={styles.itemContent}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>€{item.price.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2ecc71" />
        <Text style={styles.loadingText}>Chargement des ingrédients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={ingredients}
        renderItem={renderIngredient}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  list: {
    padding: 16,
  },
  item: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  category: {
    fontSize: 14,
    color: "#666",
    marginRight: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2ecc71",
  },
});

export default IngredientsListScreen;
