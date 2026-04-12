require("dotenv").config();

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
    clientId: process.env.EXPO_PUBLIC_CLIENT_ID,
    apiBase: process.env.EXPO_PUBLIC_API_BASE,
  },
});
export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID,
    clientId: process.env.EXPO_PUBLIC_CLIENT_ID,
    apiBase: process.env.EXPO_PUBLIC_API_BASE,
  },
});
