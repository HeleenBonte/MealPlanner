# MealPlanner

A simple app for putting together a weekly meal plan, so you don't have to spend time every week figuring out what to cook.

Add your own dishes, categories and side dishes, and let the app randomly generate a menu for the week. Dishes won't come back too soon, so your plan stays varied.

## Features

- **Manage your own dishes:** add, edit and remove meals
- **Categories:** organise dishes (for example by type of meal)
- **Side dishes:** add side dishes that go with your meals
- **Random weekly menu:** generate a full week of meals with one tap
- **No repeats:** a dish can't appear twice within 14 days
- **Fixed rules per weekday:** assign a fixed category to a day (for example fish dishes every Friday) or a fixed meal (for example pizza every Saturday), and let the randomizer fill in the remaining days
- **Android home screen widget:** see today's and tomorrow's menu at a glance, without opening the app
- **Local database:** all data is stored locally, so no account, API keys or internet connection is needed

## Offline and privacy by design

- **Works fully offline:** no internet connection is needed to use the app
- **No accounts or sign-up:** you can start using it right away
- **Data stays on your device:** dishes, categories and menus are stored in a local database and are never sent to a server
- **No tracking:** the app doesn't use analytics, advertising or third-party services

## Limitations

Because everything is stored locally, there is a trade-off:

- Data isn't synced between devices
- A menu can't be shared with family members from within the app
- The widget can't read the database directly. Each time the app is opened, it saves the menu for the whole week for the widget to display. Opening the app at least once a week keeps the widget up to date, including after changes to the menu

## Roadmap

- [ ] **Custom repeat interval per dish:** let users choose how often a dish may appear, so favourite meals can come up more often and more expensive or special dishes less often
- [ ] **Export / import:** back up or share your dishes and menus without needing an account or server
- [ ] **Optional sync and sharing:** let a household share one meal plan, without giving up the offline-first approach

## Tech stack

- TypeScript
- React Native and React
- [Expo](https://expo.dev/) with Expo Router (file-based navigation)
- SQLite via `expo-sqlite` (local database)
- React Native Reanimated and Gesture Handler

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm
- For Android: [Android Studio](https://developer.android.com/studio) with an emulator or a physical device with USB debugging
- For iOS: a Mac with Xcode

> The app uses native modules, so it can't run in Expo Go. It needs a development build (see below).

### Installation

```bash
git clone https://github.com/HeleenBonte/MealPlanner.git
cd MealPlanner
npm install
```

### Run the app

```bash
# Android
npm run android

# iOS (macOS only)
npm run ios
```

This builds a development version of the app and installs it on your emulator or connected device. After the first build you can start the development server with `npm start`.

## Download

An Android build is available on the [Releases page](https://github.com/HeleenBonte/MealPlanner/releases).
Enable "Install unknown apps" on your device to install the APK.

## Project structure

```
app/          Routes and navigation (Expo Router)
screens/      Screens of the app
components/   Reusable UI components
database/     Local database setup and queries
styles/       Shared styles
utils/        Helper functions (e.g. the meal randomizer)
assets/       Images and other static files
```

## About this project

I built this app for personal use, to make planning our weekly meals easier. It was developed with the help of AI tools, which I used to speed up development and to explore modern tooling while keeping control over the design and functionality.

## License

This project is licensed under the [MIT License](LICENSE).
