# Meal Mate Mobile

A React Native mobile app for organizing recipes, managing folders, and planning meals.

## Features

- **Recipe Management**: Save recipes from URLs or add them manually
- **Automatic Recipe Extraction**: Extract recipe details from recipe websites
- **Folder Organization**: Organize recipes into custom folders
- **Meal Planning**: Plan your meals for the week
- **Cloud Sync**: All data synced via Supabase

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Supabase** for authentication, database, and serverless functions
- **React Navigation** for navigation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Expo CLI (installed automatically with dependencies)
- Expo Go app on your phone (iOS or Android)

### Installation

1. Navigate to the mobile app directory:
```bash
cd meal-mate-mobile
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Project Structure

```
meal-mate-mobile/
├── src/
│   ├── contexts/          # React contexts (Auth)
│   ├── lib/               # Supabase client setup
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # App screens
│   ├── types/             # TypeScript types
├── App.tsx                # Root component
├── app.json               # Expo configuration
└── package.json           # Dependencies
```

## Screens

- **Auth Screen**: Sign in / Sign up
- **Recipes Screen**: Browse all recipes
- **Recipe Detail**: View full recipe with ingredients and instructions
- **Add Recipe**: Add recipes from URL or manually
- **Folders Screen**: Manage recipe folders
- **Meal Planner**: Plan meals for the week

## Database Schema

The app uses Supabase with the following tables:
- `profiles`: User profiles
- `recipes`: Recipe data with ingredients and instructions
- `folders`: Organization folders
- `meal_plans`: Meal planning schedule

## Building for Production

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

For app store deployment, see [Expo documentation](https://docs.expo.dev/build/introduction/).
