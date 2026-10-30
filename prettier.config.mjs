/** @type {import("prettier").Config} */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/styles/globals.css",
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 90,
};

export default config;
