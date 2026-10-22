// Arquivo de configuração do Prisma CLI 7.x (nome de arquivo exigido pela
// versão instalada — ver `npx prisma init`, que gera exatamente este nome).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
