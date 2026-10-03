# Interior Design for Claude Code: operating instructions

This is a studio specification and procurement database. Read actual records before answering. The demo is fictional. For business use, ask the operator to identify their studio, project currencies and priority deadlines.

## Routing

- Projects: open `.claude/commands/projects.md`.
- Suppliers: open `.claude/commands/suppliers.md`.
- Schedule: open `.claude/commands/schedule.md`.
- Approvals due: open `.claude/commands/approvals-due.md`.
- Procurement: open `.claude/commands/procurement.md`.
- Delivery chase: open `.claude/commands/delivery-chase.md`.
- Margins: open `.claude/commands/margins.md`.
- Tasks: open `.claude/commands/tasks.md`.
- Timesheets: open `.claude/commands/timesheets.md`.
- Issues: open `.claude/commands/issues.md`.
- Attention: open `.claude/commands/attention.md`.
- Compliance: open `.claude/commands/compliance.md`.
- Activity: open `.claude/commands/activity.md`.
- Project: open `.claude/commands/project.md`.
- Selection: open `.claude/commands/selection.md`.
- Questions: open `.claude/commands/questions.md`.
- Add: open `.claude/commands/add.md`.
- Approve: open `.claude/commands/approve.md`.
- Revise: open `.claude/commands/revise.md`.
- Order: open `.claude/commands/order.md`.
- Receive: open `.claude/commands/receive.md`.
- Log: open `.claude/commands/log.md`.
- Log time: open `.claude/commands/log-time.md`.
- Complete: open `.claude/commands/complete.md`.
- Issue: open `.claude/commands/issue.md`.
- Resolve: open `.claude/commands/resolve.md`.
- Privacy review: open `.claude/commands/privacy-review.md`.
- Import: open `.claude/commands/import.md`.
- Export: open `.claude/commands/export.md`.
- Draft approval: open `.claude/commands/draft-approval.md`.
- Weekly review: open `.claude/commands/weekly-review.md`.
- Customise: open `.claude/commands/customise.md`.
- New view: open `.claude/commands/new-view.md`.

## Rules

- Use scripts/studio.mjs for every routine job. Run --help for exact fields.
- Never send, publish, place a supplier order or process a payment. Draft only.
- Never invent approval evidence, receipt condition, a price, a currency or an identity.
- Stop on ambiguity and show the candidates. Ask for missing required fields.
- Read before a write. A recorded approval is evidence supplied by the operator, not consent obtained by this software.
- Quantities received are incremental. Avoid recording the same delivery twice.
- Monetary values are before tax and in project currency. Never add different currencies.
- Preserve migrations. Add a numbered migration for a change. Never erase records without explicit instruction.
- Test a copy and back up before import or schema changes. Never seed business records.
- Evidence checks flag missing records. They cannot determine legal compliance, physical quality or whether safeguards work.

## Layout

scripts/studio.mjs is the CLI. scripts/lib/db.mjs selects DATABASE_URL or local PGlite. supabase/migrations holds SQL. views.json and documents.json drive read-only HTML. brand.json sets business identity. Generated views, paperwork, drafts and local data stay out of git. .claude/commands contains the same recipes for every coding agent.

Built and run for you through Omni by Enterprise DNA: https://enterprisedna.co/omni/instead-of/programa
