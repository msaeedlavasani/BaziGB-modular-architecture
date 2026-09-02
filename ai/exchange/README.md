# AI Exchange Protocol

This directory is the governed boundary between the BaziGB Control Tower and
internal or external AI executors.

- `schemas/` and `templates/` are version-controlled contracts.
- `runtime/` is local, gitignored working data.
- Runtime states are `active`, `awaiting-decision`, `delivered`, `retired`, and
  `quarantine`.
- Only an `ACCEPTED` delivery may become a dependency of another task.
- Promote durable evidence to `docs/reports/` or its canonical document; never
  treat an ignored runtime file as backup or permanent project memory.

Generate a local Passport with:

```text
npm run task:passport -- <TASK-ID>
```

Validate a Passport or delivery receipt with:

```text
npm run check:task-package -- passport <path>
npm run check:task-package -- receipt <path>
```

An external executor receives only the short prompt, generated Passport, and
the sources referenced by that Passport. Missing authority means stop and ask.
