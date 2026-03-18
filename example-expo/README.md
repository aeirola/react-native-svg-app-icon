Created with
```sh
# Create project
npx create-expo-app@latest svg-app-icon-expo-example --yes --template blank
mv svg-app-icon-expo-example example-expo
cd example-expo
npx expo install expo-dev-client

# Add package
npm install --save-dev install-local
npx install-local --save ../
```