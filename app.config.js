const appJson = require('./app.json');

const isLocalDevelopment = !process.env.EAS_BUILD || process.env.APP_VARIANT === 'development';

module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    name: isLocalDevelopment ? 'MealPlanner Dev' : appJson.expo.name,
    android: {
      ...appJson.expo.android,
      package: isLocalDevelopment
        ? 'com.anonymous.MealPlanner.dev'
        : appJson.expo.android.package,
    },
  },
};
