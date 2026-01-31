const { defineConfig } = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

module.exports = defineConfig([
	{
		languageOptions: {
			parser: tsParser,

			parserOptions: {
				project: "./tsconfig.json",
			},
		},

		extends: compat.extends(
			"eslint:recommended",
			"plugin:@typescript-eslint/recommended",
			"plugin:@typescript-eslint/recommended-requiring-type-checking",
			"prettier",
		),
	},
]);
