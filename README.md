# Shopping List App (5mobd)

A React Native shopping list application built with Expo and React Navigation with shopping cart functionality and persistent storage.

## Features

- **Ingredients List Screen**: Displays all ingredients in a scrollable list using FlatList
- **Ingredient Details Screen**: Shows detailed information about a selected ingredient using ScrollView
- **My Shopping Screen**: Manage your shopping list with add/remove/quantity controls
- **Bottom Tab Navigation**: Easy switching between ingredients and shopping list
- **Persistent Storage**: Shopping list is saved locally using AsyncStorage
- **Context Management**: Global state management for shopping list
- **Clean Design**: Modern, minimal UI with card-based layout

## Screens

### 1. Ingredients List Screen

- Uses `FlatList` to display all ingredients from `data.json`
- Shows ingredient name, category, and price
- Tap any ingredient to navigate to details screen
- Clean card-based design with shadows

### 2. Ingredient Details Screen

- Uses `ScrollView` to display detailed ingredient information
- Shows description, category, weight, origin, and pricing details
- Calculates price per kilogram
- **Add to Shopping List** button to add ingredients to your cart
- Organized in sections for better readability

### 3. My Shopping Screen

- Displays your current shopping list
- Shows quantity controls for each item
- Remove items with confirmation dialog
- Total price calculation
- Empty state when no items are added

## Technical Implementation

### Required Components Used

- ✅ `View` - Container components
- ✅ `Text` - Text display
- ✅ `FlatList` - Ingredients list display
- ✅ `ScrollView` - Details screen scrolling
- ✅ `TouchableOpacity` - Navigation triggers

### Navigation

- ✅ `NavigationContainer` - Main navigation container
- ✅ `createNativeStackNavigator` - Stack navigation setup
- ✅ `useNavigation` hook - Navigation between screens
- ✅ Proper TypeScript typing for navigation

### Data Structure

The app uses the provided `data.json` file with 100 ingredients containing:

- ID, name, description
- Price, weight, category
- Origin information

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm start
   ```

3. Open the app on your device using the Expo Go app or run on simulator

## Project Structure

```
src/
├── screens/
│   ├── IngredientsListScreen.tsx    # Main ingredients list
│   └── IngredientDetailsScreen.tsx  # Ingredient details
├── types/
│   └── navigation.ts                # TypeScript navigation types
App.tsx                              # Main app with navigation setup
data.json                           # Ingredients data
```

## Design Features

- **Clean & Minimal**: Simple, uncluttered interface
- **Card-based Layout**: Easy-to-scan ingredient cards
- **Consistent Typography**: Clear hierarchy with proper font weights
- **Color Scheme**: Green accents for prices, neutral grays for text
- **Shadows & Elevation**: Subtle depth for better visual separation
- **Responsive Design**: Works on different screen sizes
