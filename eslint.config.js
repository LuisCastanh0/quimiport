// @ts-check
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

/**
 * Regra de dependência entre camadas (hard rule #3 e §8.3 das instruções da
 * Fase 2): domain -> nada; application -> domain; infrastructure/interfaces
 * -> livres para dentro, mas interfaces não pode importar infrastructure
 * (exceção: main.ts/container.ts, fora de src/interfaces e src/application).
 */
const boundariesElements = [
  { type: "domain", pattern: "src/domain/**" },
  { type: "application", pattern: "src/application/**" },
  { type: "infrastructure", pattern: "src/infrastructure/**" },
  { type: "interfaces", pattern: "src/interfaces/**" },
  { type: "shared", pattern: "src/shared/**" },
  { type: "composition-root", pattern: "src/*.ts" },
];

export default [
  {
    ignores: [
      "dist/**",
      "generated/**",
      "coverage/**",
      "node_modules/**",
      "prisma/migrations/**",
      "docs/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      boundaries,
    },
    settings: {
      "boundaries/elements": boundariesElements,
      "boundaries/ignore": ["**/*.spec.ts"],
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
      // TypeScript já detecta identificadores/namespaces inexistentes
      // (incluindo tipos globais do @types/node como `NodeJS`); no-undef do
      // ESLint não entende tipos e gera falso-positivo nesses casos.
      "no-undef": "off",
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "domain" } },
              allow: { to: { element: { types: { anyOf: ["domain", "shared"] } } } },
            },
            {
              from: { element: { type: "application" } },
              allow: {
                to: { element: { types: { anyOf: ["domain", "application", "shared"] } } },
              },
            },
            {
              from: { element: { type: "infrastructure" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["domain", "application", "infrastructure", "shared"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "interfaces" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["domain", "application", "interfaces", "shared"] } },
                },
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
            {
              from: { element: { type: "composition-root" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["domain", "application", "infrastructure", "interfaces", "shared"],
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },
  // Domínio e aplicação são framework-free: nenhum import de fastify, prisma,
  // zod ou pino (hard rule #4).
  {
    files: ["src/domain/**/*.ts", "src/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "fastify", message: "Domínio/aplicação devem ser framework-free." },
            { name: "@prisma/client", message: "Domínio/aplicação devem ser framework-free." },
            { name: "zod", message: "Domínio/aplicação devem ser framework-free." },
            { name: "pino", message: "Domínio/aplicação devem ser framework-free." },
          ],
          patterns: [
            { group: ["fastify-type-provider-zod"], message: "Domínio/aplicação devem ser framework-free." },
          ],
        },
      ],
    },
  },
  prettier,
];
