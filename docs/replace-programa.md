# Move a Programa schedule into your own database

Checked 2026-10-03. No customer export was available for this build. Tests use synthetic files based on documented fields. First reconcile a small real export before promising a cutover date.

## Export and prepare

Programa's [Excel export guide](https://help.programa.com.au/en/articles/7208740-how-to-export-your-schedule-to-excel) says to open a schedule, use its three-dot menu and choose Export as XLS. The download arrives by email. Export each schedule separately. If it is a legacy .xls file, save it as .xlsx or UTF-8 CSV in Excel or LibreOffice. This importer reads .xlsx and .csv, not the legacy binary .xls format. Keep the original untouched.

Choose the data sheet and header row. Use --sheet="Schedule" and --header-row=3 when appropriate. Flatten merged headings and save formulas as values in the copy. Image objects are not extracted. Keep a stable item identifier across future imports. Doc Code must be unique within the destination project. If codes repeat between schedules, prefix them with a stable schedule identifier before import.

## One import command

```bash
node scripts/studio.mjs import programa --file=studio.xlsx --project="Harbour House" --client="Mia Chen" --currency=NZD --dry-run --json
```

Read the reported count, cost, sales total and unmapped columns. Check against the source. Run the same command without --dry-run once the mapping agrees. A dry run uses a transaction and rolls back all writes. A failed import also rolls back the whole file. Repeated imports update selections by destination project and item identifier. An absent row is not deleted. Changing a code creates another selection. Import never creates approval, receipt or order evidence.

## Fields

Programa's [field reference](https://help.programa.com.au/en/articles/8304321-understanding-schedule-information-fields) describes product names, location details, document codes, quantities and supplier details. The actual export headings are not fixed by that article. Supply --map=columns.json when they differ. The file maps our field key to your exact heading. examples/columns.json shows the shape.

| Our key | Recognised headings | Meaning |
|---|---|---|
| key | ID, Product ID, Item ID, Doc Code, Code | Stable identifier, required |
| name | Product Name, Name | Selection name, required |
| room | Room, Section, Product Details | Room/location, required |
| supplier | Supplier, Supplier Company | Supplier, required |
| sku | SKU, Product Code SKU | Product reference |
| specification | Specification, Description, Product Description | Specification text |
| quantity | Quantity, Qty | Positive quantity, required |
| cost | Trade Price, Unit Cost | Unit supplier cost |
| price | Unit Price, Unit Client Price, Sell Price | Unit sale price |
| cost_total | Cost, Total Cost | Line supplier cost, used when unit cost is absent |
| client_total | Client Price, Total Client Price | Line sale price, used when unit price is absent |
| lead | Lead Days | Whole number of days, default zero |
| required | Required Date | YYYY-MM-DD |
| image | Image URL | Image reference only |

The [pricing calculation guide](https://help.programa.com.au/en/articles/11898903-how-product-pricing-calculations-work-in-schedules) distinguishes unit trade price from cost after quantity, and illustrates client pricing as a line total. Confirm your export follows this. Unit fields take precedence over total fields. Line totals divide by quantity and must yield a two-decimal unit price. Convert formatted currencies to decimal numbers. Currency comes from the explicit command flag. No exchange rates or tax recalculation are applied. Convert a lead time expressed as weeks or text to whole days in the import copy.

## What needs separate work

Embedded images, attachments, pinboards, presentations, client portal access, comments, approval signatures, invoices, payments and time history do not come across through this schedule importer. Product statuses remain unmapped because a word such as Approved is not approval evidence. Combine dimensions, colour, materials and finish into the specification field when you need them, or extend the mapping through /customise. These original columns appear in the unmapped-column report until mapped or combined.

Programa's [address book guide](https://help.programa.com.au/en/articles/9246181-address-book-overview-and-how-to-manage-your-contacts) directs customers to its support team for an address-book CSV. This build does not import that separate file. Supplier names from the schedule become records without contact details. Add those details from a verified source.

## Reconcile and cut over

Compare item count, quantities, line costs and client totals by currency. Inspect several room specifications. Confirm zeros are real rather than missing data. New projects have a zero budget and a placeholder client unless supplied. Set the actual budget before relying on budget reports. Import into a clean database first, keep the original files and backups, then run a complete studio review. Agree where documents, approvals and accounting history will live before ending your old subscription.

Enterprise DNA maps your exports, brings the needed history across and builds your workflows as part of your version. Bring one schedule and the records you need to a [30-minute call with Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=programa).
