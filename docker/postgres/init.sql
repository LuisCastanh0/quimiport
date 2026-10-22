-- Executado automaticamente pela imagem oficial do Postgres na primeira
-- inicialização do volume (montado em /docker-entrypoint-initdb.d/).
-- Cria o banco usado pelos testes de integração (`DATABASE_URL_TEST`),
-- separado do banco de aplicação (`POSTGRES_DB`, criado pela própria
-- imagem a partir da env var).
CREATE DATABASE quimiport_test;
