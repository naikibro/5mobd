# Shopping List App (5mobd)

A React Native shopping list application built with Expo and React Navigation with shopping cart functionality, user authentication, and persistent storage.

## Features

- **User Authentication**: Full authentication system with Firebase
  - Sign up with email and password
  - Login with email and password
  - Profile management (update name, email, password)
  - Logout functionality
- **Ingredients List Screen**: Displays all ingredients from Firestore in a scrollable list using FlatList
- **Ingredient Details Screen**: Shows detailed information about a selected ingredient using ScrollView
- **My Shopping Screen**: Manage your shopping list with add/remove/quantity controls
- **Profile Screen**: Update user information and manage account
- **Bottom Tab Navigation**: Easy switching between ingredients, shopping list, and profile
- **Cloud Storage**: Shopping lists are saved per user in Firestore
- **Context Management**: Global state management for shopping list and authentication
- **Clean Design**: Modern, minimal UI with card-based layout

## Screens

### 1. Ingredients List Screen

- Uses `FlatList` to display all ingredients from Firestore
- Shows ingredient name, category, and price
- Real-time data fetching from cloud database
- Loading state with spinner
- Tap any ingredient to navigate to details screen
- Clean card-based design with shadows

### 2. Ingredient Details Screen

- Uses `ScrollView` to display detailed ingredient information
- Shows description, category, weight, origin, and pricing details
- Calculates price per kilogram
- **Add to Shopping List** button to add ingredients to your cart
- Organized in sections for better readability

### 3. My Shopping Screen

- Displays your current shopping list from Firestore
- Per-user shopping lists (isolated by user ID)
- Shows quantity controls for each item
- Remove items with confirmation dialog
- Real-time updates to cloud database
- Total price calculation
- Empty state when no items are added

### 4. Login Screen

- Email and password authentication
- Link to signup screen
- Error handling for invalid credentials

### 5. Signup Screen

- Create account with email, password, and display name
- Password confirmation
- Input validation
- Link to login screen

### 6. Profile Screen

- Update display name
- Update email address
- Change password
- Logout functionality
- Organized in sections for better UX

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

The app uses Firestore database with two collections:

**ingredients** - Contains all available ingredients:

- ID, name, description
- Price, weight, category
- Origin information

**shoppingList** - Per-user shopping lists:

- User ID, ingredient details
- Quantity, added date
- All ingredient properties

## Getting Started

w### 1. Install dependencies:

```bash
npm install
```

### 2. Firebase Setup:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Authentication** with Email/Password provider
4. Enable **Firestore Database** in production mode
5. Get your Firebase configuration from Project Settings > General
6. Create a `.env` file with your Firebase credentials (see `src/config/env.ts` for required variables)

### 3. Import Data to Firestore:

To import the ingredients data to Firestore:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key" and save as `serviceAccountKey.json` in the project root
3. Install firebase-admin:

```bash
npm install --save-dev firebase-admin
```

4. Run the import script:

```bash
node importData.js
```

This will import all 100 ingredients from `data.json` to your Firestore `ingredients` collection.

### 4. Start the development server:

```bash
npm start
```

### 5. Open the app:

Open the app on your device using the Expo Go app or run on simulator

## Project Structure

```
src/
├── screens/
│   ├── IngredientsListScreen.tsx    # Main ingredients list
│   ├── IngredientDetailsScreen.tsx  # Ingredient details
│   ├── MyShoppingScreen.tsx         # Shopping cart
│   ├── LoginScreen.tsx              # User login
│   ├── SignupScreen.tsx             # User registration
│   └── ProfileScreen.tsx            # User profile management
├── context/
│   ├── ShoppingListContext.tsx      # Shopping list state management
│   └── AuthContext.tsx              # Authentication state management
├── types/
│   └── navigation.ts                # TypeScript navigation types
App.tsx                              # Main app with navigation setup
firebaseConfig.ts                    # Firebase configuration
metro.config.js                      # Metro bundler config
data.json                            # Ingredients data
```

## Design Features

- **Clean & Minimal**: Simple, uncluttered interface
- **Card-based Layout**: Easy-to-scan ingredient cards
- **Consistent Typography**: Clear hierarchy with proper font weights
- **Color Scheme**: Green accents for prices, neutral grays for text
- **Shadows & Elevation**: Subtle depth for better visual separation
- **Responsive Design**: Works on different screen sizes

- **Responsive Design**: Works on different screen sizes
