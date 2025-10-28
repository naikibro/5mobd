<div align="center">

  <h1>5mobd - Address Sharing App</h1>
  <p>
    <b>A React Native app for sharing and discovering addresses with reviews, built with Expo and Firebase.</b><br/>
  </p>
  
  <p>
    <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-22.x-brightgreen" alt="Node 22"/></a>
    <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-0.72-blue" alt="React Native"/></a>
    <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-49-black" alt="Expo"/></a>
    <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-9.x-orange" alt="Firebase"/></a>
    <a href="https://zustand-demo.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-4.x-purple" alt="Zustand"/></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript"/></a>
  </p>
</div>

## 📱 Download

<div align="center">
  <table>
    <tr>
      <th>Platform</th>
      <th>Download Link</th>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/Android-3DDC84?logo=android&logoColor=white" alt="Android"/>
      </td>
      <td>
        <a href="https://drive.google.com/file/d/1A_G5nvHnwtlruWBsq7XU4RjNSg11GUkT/view?usp=sharing">
          Download APK
        </a>
      </td>
    </tr>
    <tr>
      <td>
        <img src="https://img.shields.io/badge/iOS-000000?logo=ios&logoColor=white" alt="iOS"/>
      </td>
      <td>
        <a href="https://drive.google.com/file/d/1NLelQ-63vm6YR3B2C01UYPETVbZocok6/view?usp=sharing">
          Download IPA
        </a>
      </td>
    </tr>
  </table>
</div>

## Features

| Feature                 | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| **User Authentication** | Sign up, login, and profile management               |
| **Address Management**  | Create, view, and manage addresses                   |
| **Reviews System**      | Rate and review addresses with photos                |
| **Map Integration**     | View addresses on an interactive map                 |
| **Real-time Updates**   | Automatic data synchronization with 5-second polling |
| **Photo Support**       | Upload and view photos for addresses and profiles    |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** with Email/Password
3. Enable **Firestore Database**
4. Enable **Storage** for photo uploads
5. Copy your Firebase config to `firebaseConfig.ts`

### 3. Env variables setup

Setup your .env with the correct values from firebase

```sh
cp .env.example .env
```

### 4. Run the App

```bash
yarn
yarn start
```

Then scan the QR code with Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

## Development

- `yarn start` - Start Expo development server
- `yarn run android` - Run on Android
- `yarn run ios` - Run on iOS
- `yarn test` - Run tests
