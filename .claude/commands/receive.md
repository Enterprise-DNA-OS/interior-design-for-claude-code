# Receive

Read the order through /procurement. Run `node scripts/studio.mjs receive "<order reference>" --quantity=<quantity received now> --condition="<observed condition>" --date=YYYY-MM-DD --json`. Quantity is incremental, not the cumulative total. Log damage with /issue.

When a name is ambiguous, list the candidates and ask. Never send or publish. Never answer from memory.
