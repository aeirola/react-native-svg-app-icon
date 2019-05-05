module.exports = {
  plugins: ["@babel/plugin-syntax-dynamic-import", "dynamic-import-node"],
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        targets: {
          node: "8"
        }
      }
    ]
  ]
};
