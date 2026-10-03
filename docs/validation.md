# Validation evidence

Local Linux checks on 2026-10-03, Node 22:

- npm install completed.
- npm test passes the embedded database suite, including every CLI action and all ten questions.
- npm run demo passes migration, seed and the attention report.
- Four dashboards and four document families render from the database.
- Synthetic CSV and XLSX fixtures test mapping, line totals, repeatability and rollback. A real Programa export has not been tested.

The CI workflow also runs Windows and Postgres 17. Remote results are recorded here after the private push. TEST_DATABASE_URL must point to an empty disposable database. The test refuses a database with existing public tables.
