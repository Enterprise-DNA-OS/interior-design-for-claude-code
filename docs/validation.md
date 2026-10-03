# Validation evidence

Local Linux checks on 2026-10-03, Node 22:

- npm install completed.
- npm test passed 74 checks, including every CLI action and all ten questions.
- npm run demo passes migration, seed and the attention report.
- Four dashboards and four document families render from the database.
- Synthetic CSV and XLSX fixtures test mapping, line totals, repeatability and rollback. A real Programa export has not been tested.

GitHub Actions run [37161095538](https://github.com/Enterprise-DNA-OS/interior-design-for-claude-code/actions/runs/37161095538) passed Ubuntu PGlite, Windows PGlite and Postgres 17. All three jobs completed successfully. The build ships 33 command recipes. TEST_DATABASE_URL must point to an empty disposable database. The test refuses a database with existing public tables.
