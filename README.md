### Thees are need in the .env file

EXPO_PUBLIC_API_BASE= 
EXPO_PUBLIC_USER_POOL_ID=
EXPO_PUBLIC_COGNITO_CLIENT_ID=

> [!Note] Note
>
>For EAS builds — .env files aren't bundled with EAS automatically. You need to add the variables to your EAS project secrets so they're available during cloud builds:


``` shell
npx eas-cli env:create --scope project --name EXPO_PUBLIC_USER_POOL_ID --value "..." --environment preview
npx eas-cli env:create --scope project --name EXPO_PUBLIC_CLIENT_ID   --value ".." --environment preview
npx eas-cli env:create --scope project --name EXPO_PUBLIC_API_BASE    --value "..." --environment preview
```
