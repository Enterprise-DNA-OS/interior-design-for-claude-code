# Interior Design for Claude Code

Specifications, approvals, purchasing, deliveries and studio margins in a database you own. Built by Enterprise DNA. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free under MIT. Follow the quick start. | Your fields, rules, Programa mapping, client experience and optional web front end. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=programa). | Installed, connected and operated through **Omni by Enterprise DNA**. One setup fee, then a retainer. [See the offer](https://enterprisedna.co/omni/instead-of/programa). |

## Quick start

Node 22 on Windows or Linux. The demo needs no database installation.

```bash
git clone https://github.com/Enterprise-DNA-OS/interior-design-for-claude-code.git
cd interior-design-for-claude-code
npm install
npm test
npm run demo
npm run view
npm run docs
```

Open the folder in your coding agent and ask for /weekly-review. Fictional Harbour House and Fitzroy Studio include a late part delivery, a damaged pendant, an overdue fabric task, an unapproved chair and a below-cost selection. Dates move with the first seed. Repeating seed preserves existing records.

## The studio week

1. Check room schedules and obtain selection approvals.
2. Review order deadlines against lead times.
3. Chase late deliveries and record partial receipts and condition.
4. Compare selection totals, budgets and gross margins by project currency.
5. Review overdue tasks, design time and unresolved product issues.

The CLI stores projects, suppliers, selections, approval evidence, orders, tasks, time, product issues and activity. Selection changes create a new revision requiring fresh approval. Orders require current approval. Ordered specifications are frozen and receipts cannot exceed the quantity. One order represents one selection line with a unique reference. It records a purchase order draft, never places an order with a supplier.

## Commands

- `/projects`: Run `node scripts/studio.mjs projects --json`.
- `/suppliers`: Run `node scripts/studio.mjs suppliers --json`.
- `/schedule`: Run `node scripts/studio.mjs schedule --json`.
- `/approvals-due`: Run `node scripts/studio.mjs approvals-due --json`.
- `/procurement`: Run `node scripts/studio.mjs procurement --json`.
- `/delivery-chase`: Run `node scripts/studio.mjs delivery-chase --json`.
- `/margins`: Run `node scripts/studio.mjs margins --json`.
- `/tasks`: Run `node scripts/studio.mjs tasks --json`.
- `/timesheets`: Run `node scripts/studio.mjs timesheets --json`.
- `/issues`: Run `node scripts/studio.mjs issues --json`.
- `/attention`: Run `node scripts/studio.mjs attention --json`.
- `/compliance`: Run `node scripts/studio.mjs compliance --json`.
- `/activity`: Run `node scripts/studio.mjs activity --json`.
- `/project`: Run `node scripts/studio.mjs project "<name or id>" --json`.
- `/selection`: Run `node scripts/studio.mjs selection "<name or id>" --json`.
- `/questions`: Run `node scripts/studio.mjs questions --json`, choose the matching question, then run it with `--question=N --json`.
- `/add`: Read `node scripts/studio.mjs --help`.
- `/approve`: Read the selection first.
- `/revise`: Read the selection.
- `/order`: Read the selection and its current approval.
- `/receive`: Read the order through /procurement.
- `/log`: Run `node scripts/studio.mjs log "<project>" --note="<operator note>" --json`.
- `/log-time`: Run `node scripts/studio.mjs time "<project>" --person="<person>" --minutes=<whole minutes> --rate=<hourly rate> --note="<work>" --json`.
- `/complete`: Read /tasks.
- `/issue`: Read the selection, then run `node scripts/studio.mjs issue "<selection>" --note="<observed problem>" --json`.
- `/resolve`: Read /issues, then run `node scripts/studio.mjs resolve "<issue id>" --resolution="<agreed remedy and evidence reference>" --json`.
- `/privacy-review`: Read docs/compliance.md.
- `/import`: Read docs/replace-programa.md.
- `/export`: Run `node scripts/studio.mjs export --out="<new private JSON path>" --json`.
- `/draft-approval`: Read /project and /approvals-due.
- `/weekly-review`: Run `node scripts/studio.mjs attention --json`, `node scripts/studio.mjs delivery-chase --json`, and `node scripts/studio.mjs margins --json`.
- `/customise`: Ask which field or rule the operator wants changed.
- `/new-view`: Read views.json and the existing database views.

Run `node scripts/studio.mjs --help` for arguments. Read commands show aligned text by default and accept --json. Names match without case; ID prefixes work. Ambiguous matches list candidates and exit 1. The recipes are in .claude/commands.

## Ten questions across your records

These are implemented queries beyond a single schedule. They demonstrate this build's analysis, not a claim that Programa cannot produce an equivalent report. Run `node scripts/studio.mjs questions --question=N`.

1. Which unapproved selections have already missed their order deadline?
2. Which late deliveries also have an unresolved product issue?
3. Which rooms have the most unapproved spending?
4. Which selections are priced below supplier cost?
5. Which projects exceed their selection budget?
6. How much gross margin remains after recorded design time?
7. Which suppliers have outstanding quantities across projects?
8. Which deliveries are expected after the required date?
9. Which active projects have gone quiet for more than fourteen days?
10. Which current approvals no longer have a matching selection revision?

The margin-after-time question subtracts recorded billable time value, not employee cost. Budget comparisons use selection sales totals. All figures are before tax, delivery charges and discounts unless those amounts were already included in your imported unit values. Project currencies never combine. There is no currency conversion, tax engine, payment processing or accounting reconciliation.

## Your first hour: ten things to ask for

1. Show this week's approvals and delivery problems.
2. Show Harbour House's selections by room.
3. Find selections whose ordering date has passed.
4. Explain the Fitzroy pendant's negative margin.
5. Record the approval reference I supply.
6. Record two chairs arriving in good condition.
7. Draft an approval request and leave it unsent.
8. Render a client schedule with our business name.
9. Check our Programa export and reconcile quantities and money before importing.
10. Add a finish-sample reference with /customise.

## Bring your records

[The switching guide](docs/replace-programa.md) documents Programa's Export as XLS option, saving as XLSX or CSV where needed, supported fields, mapping and reconciliation. Import is one command once the file and mapping are ready. The dry run validates the whole file and rolls back all writes. Repeated imports update by project and stable item code; a changed code means a new record. Local approvals, orders and notes are never inferred from imported status labels. Keep a backup before any import.

Client Price and Cost from Programa are treated as line totals. Unit Price and Trade Price are unit values. Totals are divided by quantity; a total that cannot be represented by a two-decimal unit price is rejected for review. Do not silently substitute recommended retail price for actual supplier cost.

For business data, use a fresh DATA_DIR, run npm run migrate and do not seed. DATABASE_URL selects a shared Postgres database. Otherwise PGlite stores locally in .data/db. Configure private access, database roles, backups and document storage before real use. Do not share a local database directory between running processes.

`node scripts/studio.mjs export --out=private-snapshot.json` exports all nine record types to a new JSON file. This is an exchange snapshot, not a restore command. Keep native database backups and original documents.

## Paperwork and views

Edit brand.json once for your business name, logo path and colours. npm run docs renders client schedules, purchase order drafts, delivery records and approval registers. Client schedules omit supplier costs and contact details. They are working documents, not tax invoices. npm run view renders the studio week, procurement, project money and evidence checks. Open the HTML locally and print it. Nothing is hosted or sent.

[Compliance notes](docs/compliance.md) distinguish New Zealand source-based evidence prompts from studio rules. They do not certify compliance or inspect goods. [Why no front end](docs/why-no-front-end.md) describes where a visual interface or mobile workflow needs separate work.

## Validation

npm test uses temporary data and covers every CLI action, all ten questions, migration and seed repeatability, stale approvals, frozen orders, over-receipt guards, ambiguous names, CSV/XLSX mapping, line-total handling, rollback, snapshots, drafts and HTML. GitHub Actions runs Linux and Windows embedded tests and a Postgres 17 job. [Observed results](docs/validation.md).

## Licence

MIT. Copyright 2026 Enterprise DNA. Programa is named for compatibility and comparison. No affiliation or endorsement is implied.
