# Microsoft Dynamics 365 Client Script Architecture Guide

A reference architecture for TypeScript-based Dynamics 365 web resources. Defines folder structure, naming conventions, and code patterns for scalable, maintainable client scripts.

## Table of Contents

- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Naming Conventions](#naming-conventions)
- [Form Handlers](#form-handlers)
- [Entity Module Blueprint](#entity-module-blueprint)
- [Repository Pattern](#repository-pattern)
- [Code Patterns](#code-patterns)
- [Registration in Dynamics 365](#registration-in-dynamics-365)
- [Best Practices](#best-practices)
- [Architecture Recommendations](#architecture-recommendations)

---

## Getting Started

```bash
npm install
npm run build        # production build
npm run build:dev    # development build with source maps
npm run clean        # delete dist/
```

Output is in `dist/`. Each deployable web resource compiles to its own `.js` file.

**Stack:** TypeScript (strict, ES5) · Webpack 5 multi-entry · `@types/xrm`

---

## Folder Structure

```
src/
├── shared/                          # Shared infrastructure
│   ├── constants/
│   │   └── environment-variables.constants.ts   # D365 env var schema names
│   ├── entities/
│   │   └── base/
│   │       └── entity.ts            # Abstract Entity base class
│   ├── repositories/
│   │   ├── repository.ts            # Repository<T> base class
│   │   └── environment-variable.repository.ts
│   ├── types/
│   │   └── xrm.d.ts                 # Window.MSDC global declaration
│   └── utils/
│       └── xrm-context.util.ts      # Safe Xrm accessor (iframe-aware)
│
└── <entity>/                        # One folder per D365 entity
    ├── entities/
    │   ├── <entity>.entity.ts       # Entity class + all static metadata
    │   └── <entity>.repository.ts  # Typed repository subclass
    ├── forms/
    │   ├── _shared.form.ts          # Common form logic (not registered in D365)
    │   └── <variant>.form.ts        # One file per form variant
    ├── ribbons/
    │   └── main.ribbon.ts
    ├── business/
    │   ├── validation.ts
    │   └── workflow.ts
    └── index.ts                     # Public API re-exports
```

---

## Naming Conventions

### Files

Pattern: `<name>.<type>.ts` — lowercase with dashes.

| Type | Examples |
|------|---------|
| Entity | `case.entity.ts`, `contact.entity.ts` |
| Repository | `case.repository.ts` |
| Form | `main-sales.form.ts`, `quick-create.form.ts`, `_shared.form.ts` |
| Ribbon | `main.ribbon.ts`, `subgrid.ribbon.ts` |
| Page | `status-app.page.ts` |
| Dialog | `update-category.dialog.ts` |
| Business | `validation.ts`, `workflow.ts` |
| Constants | `environment-variables.constants.ts` |
| Utility | `xrm-context.util.ts` |

❌ **Avoid:** `Case.Form.ts`, `CaseMainForm.ts`, `Case.Commandbar.ts`

### Exports

Use **PascalCase `as const` objects** — one per file, grouping all handlers.

```ts
// ✅
export const CaseMainSalesForm = { onLoad, onSave, onServiceChange } as const;

// ❌
export function onLoad() {}
export function onSave() {}
```

### Form handler naming

Pattern: `[Entity][FormType][Variant]Form`

| Segment | Values |
|---------|--------|
| Entity | PascalCase: `Case`, `Contact`, `Email` |
| FormType | `Main`, `QuickCreate`, `Mobile` |
| Variant | Optional: `Sales`, `Service`, `Manager` |

Examples: `CaseMainSalesForm`, `CaseQuickCreateForm`, `ContactMainForm`

---

## Form Handlers

Each form variant has its own file. Logic shared across variants lives in `_shared.form.ts` and is **never registered directly in D365**.

### `_shared.form.ts`

```ts
export const SharedFormLogic = {
    initializeForm: async (formContext: Xrm.FormContext): Promise<void> => {
        // common setup: field rules, event handlers, subgrids
    },
    validateCommonFields: (formContext: Xrm.FormContext): boolean => {
        return CaseValidation.validateSubject(formContext) &&
               CaseValidation.validateCustomer(formContext);
    }
} as const;
```

### Form variant

```ts
// src/case/forms/main-sales.form.ts

/**
 * Case Main Form - Sales View
 * Form ID: {aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa}
 * Audience: Sales team · Roles: Sales Representative, Sales Manager
 */
export const CaseMainSalesForm = {
    onLoad: async (executionContext: Xrm.Events.EventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();
        await SharedFormLogic.initializeForm(formContext);
        setupFieldVisibility(formContext);
    },

    onSave: (executionContext: Xrm.Events.SaveEventContext): void => {
        const formContext = executionContext.getFormContext();
        if (!SharedFormLogic.validateCommonFields(formContext)) {
            executionContext.getEventArgs().preventDefault();
        }
    },

    onSubjectChange: async (executionContext: Xrm.Events.EventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();
        await CaseWorkflow.updateFieldsBasedOnService(formContext);
    }
} as const;

// ── Private helpers ──────────────────────────────────────────────────────────

function setupFieldVisibility(formContext: Xrm.FormContext): void {
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Priority)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.CaseType)?.setVisible(false);
}

// ── D365 global registration ─────────────────────────────────────────────────

if (typeof window !== "undefined") {
    window.MSDC = window.MSDC || {};
    window.MSDC.Case = window.MSDC.Case || {};
    window.MSDC.Case.MainSalesForm = CaseMainSalesForm;
}
```

---

## Entity Module Blueprint

### Entity class

All entity metadata lives as `static` properties on the entity class. No separate constants file.

```ts
// case/entities/case.entity.ts
export class CaseEntity extends Entity {
    static LogicalName = "incident";

    static Fields = {
        CaseId:      "incidentid",
        Title:       "title",
        CaseNumber:  "ticketnumber",
        StateCode:   "statecode",
        StatusCode:  "statuscode",
        Customer:    "customerid",
        Subject:     "subjectid",
        CaseType:    "casetypecode",
        Origin:      "caseorigincode",
        Priority:    "prioritycode",
        Owner:       "ownerid",
        Description: "description"
    } as const;

    static StateCode  = { Active: 0, Inactive: 1 } as const;

    static StatusCode = {
        Active: 1, Draft: 100000000, InProgress: 100000001,
        PendingReview: 100000002, Resolved: 2, Cancelled: 100000003
    } as const;

    static FormIds = {
        Main:        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        QuickCreate: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    } as const;
}

export type CaseStatusCode = typeof CaseEntity.StatusCode[keyof typeof CaseEntity.StatusCode];
export type CaseStateCode  = typeof CaseEntity.StateCode[keyof typeof CaseEntity.StateCode];
export type CaseFields     = typeof CaseEntity.Fields[keyof typeof CaseEntity.Fields];
```

### Repository subclass

```ts
// case/entities/case.repository.ts
export class CaseRepository extends Repository<CaseEntity> {
    constructor() { super(CaseEntity); }
}
```

### `index.ts`

```ts
// case/index.ts
export { CaseEntity } from "./entities/case.entity";
export { CaseRepository } from "./entities/case.repository";
export type { CaseStatusCode, CaseStateCode, CaseFields } from "./entities/case.entity";

export { CaseMainSalesForm }   from "./forms/main-sales.form";
export { CaseMainServiceForm } from "./forms/main-service.form";
export { CaseQuickCreateForm } from "./forms/quick-create.form";
// _shared.form.ts is NOT exported — internal only

export { CaseMainRibbon }  from "./ribbons/main.ribbon";
export { CaseValidation }  from "./business/validation";
export { CaseWorkflow }    from "./business/workflow";
```

---

## Repository Pattern

All data access extends `Repository<T>`, which wraps `Xrm.WebApi` with typed CRUD operations.

### Base classes

```ts
// shared/entities/base/entity.ts
export abstract class Entity {
    readonly id?: string;
}

// shared/repositories/repository.ts
type EntityConstructor<T extends Entity> = { new(...args: any[]): T; LogicalName: string; };

export abstract class Repository<T extends Entity> {
    constructor(entityType: EntityConstructor<T>) {
        this.entityLogicalName = entityType.LogicalName;
        this.xrm = getXrmContext();
    }
    // retrieve, retrieveMultiple, create, update, delete
}
```

`LogicalName` on the entity class is all the repository needs to determine the Web API endpoint — no extra configuration in subclasses.

### Environment variables

D365 environment variables follow the same pattern through `EnvironmentVariableRepository`:

```ts
// shared/constants/environment-variables.constants.ts
export const EnvironmentVariables = {
    Case: {
        Configuration: "msdc_CaseConfiguration",
        StatusAppURL:  "msdc_CaseStatusAppURL"
    }
} as const;

// Usage
const url = await new EnvironmentVariableRepository().getValue(
    EnvironmentVariables.Case.StatusAppURL
);
```

### `xrm-context.util.ts`

Resolves `Xrm` safely from both top-level pages and iframe web resources:

```ts
export function getXrmContext(): typeof Xrm {
    if (typeof Xrm !== "undefined") return Xrm;
    const parentXrm = (window?.parent as unknown as Record<string, unknown>)?.["Xrm"];
    if (parentXrm) return parentXrm as typeof Xrm;
    throw new Error("Xrm context not available.");
}
```

---

## Code Patterns

### Validation

```ts
export const CaseValidation = {
    validateSubject: (formContext: Xrm.FormContext): boolean => {
        const value = formContext.getAttribute(CaseEntity.Fields.Subject)?.getValue();
        if (!value || (value as any[]).length === 0) {
            Xrm.Navigation.openAlertDialog({ text: "Please select a subject before saving." });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setFocus();
            return false;
        }
        return true;
    }
} as const;
```

### Error handling

```ts
// ✅ DO
try {
    await repository.retrieve(id, [CaseEntity.Fields.Subject]);
} catch (error) {
    console.error("Failed to load case:", error);
    Xrm.Navigation.openAlertDialog({ text: "Unable to load case data. Please refresh." });
}

// ❌ DON'T — silent failure
await repository.retrieve(id).catch(() => {});
```

### TypeScript

```ts
// ✅ DO — typed attributes and controls
const attr = formContext.getAttribute<Xrm.Attributes.LookupAttribute>(CaseEntity.Fields.Subject);
formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setVisible(true);

// ❌ DON'T — magic strings and any casts
const attr = formContext.getAttribute("subjectid") as any;
```

---

## Registration in Dynamics 365

### Form events

Open **Form Editor → Form Properties → Events → Form Libraries** → Add your `.js` web resource.

| Event | Handler function | Pass execution context |
|-------|-----------------|------------------------|
| OnLoad | `MSDC.Case.MainSalesForm.onLoad` | ✅ |
| OnSave | `MSDC.Case.MainSalesForm.onSave` | ✅ |
| OnChange | `MSDC.Case.MainSalesForm.onSubjectChange` | ✅ |

### Ribbon / Command Bar

Use **Ribbon Workbench** or **Command Designer**:

- **Library:** upload `dist/case/ribbons/main.ribbon.js` as a web resource
- **Function:** `MSDC.Case.MainRibbon.openNewCase`
- **Pass execution context:** ✅ (for record context)

### Build output → web resource mapping

| Entry point | Compiled output |
|-------------|----------------|
| `case/forms/main-sales.form.ts` | `dist/case/forms/main-sales.form.js` |
| `case/forms/main-service.form.ts` | `dist/case/forms/main-service.form.js` |
| `case/forms/quick-create.form.ts` | `dist/case/forms/quick-create.form.js` |
| `case/ribbons/main.ribbon.ts` | `dist/case/ribbons/main.ribbon.js` |

---

## Best Practices

### Form handlers
- One file per form variant — never mix logic for multiple forms in one file.
- Document the form ID, audience, and security roles in a JSDoc comment at the top.
- Put logic shared across forms in `_shared.form.ts`; do not register it in D365.

### Entity design
- All field names, status codes, and GUIDs are `static` properties on the entity class — use `CaseEntity.Fields.X`, not magic strings.
- Use `as const` on every static object for full type narrowing.
- Prefer standard D365 system fields over custom `msdc_*` fields where they exist.

### Data access
- Use repositories for all `Xrm.WebApi` calls — never call the API directly from form handlers.
- Use `EnvironmentVariableRepository` for reading D365 environment variables; store schema names in `shared/constants/environment-variables.constants.ts`.

### TypeScript
- Strict mode is required — resolve all type errors, never suppress with `any`.
- Use `@types/xrm` (the official npm package) — do not hand-write Xrm declarations.
- Use `Xrm.Controls.StandardControl` for `setVisible()` / `setFocus()` calls.

### Build
- One JS output per deployable web resource — webpack entries are explicit, `splitChunks` is disabled.
- No `.d.ts` output — declaration files are unnecessary for D365 web resources.

### Adding a new entity

1. Create `src/<entity>/` following the folder structure above.
2. Add entry points in `webpack.config.js`:
   ```js
   '<entity>/forms/main.form':     './src/<entity>/forms/main.form.ts',
   '<entity>/ribbons/main.ribbon': './src/<entity>/ribbons/main.ribbon.ts',
   ```
3. Create `src/<entity>/index.ts` with public re-exports.

---

## Architecture Notes

### `EntitySetName` static property

Each entity class exposes `static EntitySetName` alongside `LogicalName`. Use it for OData queries where the plural form is needed directly (e.g. `$batch` requests):

```ts
static EntitySetName = "incidents";
```

### Typed `retrieve` select parameter

`Repository<T, TFields>` accepts a second generic parameter to constrain the `select` argument to known field names. `CaseRepository` is typed as `Repository<CaseEntity, CaseFields>`, so passing an unknown field name is a compile-time error:

```ts
// ✅ compiles
repository.retrieve(id, [CaseEntity.Fields.Subject, CaseEntity.Fields.Priority]);

// ❌ compile error — "unknownfield" is not assignable to CaseFields
repository.retrieve(id, ["unknownfield"]);
```

### Centralised D365 registration

All form and ribbon files use `registerHandler` from `shared/utils/register-handler.util.ts` instead of the 4-line `window.MSDC` block:

```ts
import { registerHandler } from "../../shared/utils/register-handler.util";

registerHandler("Case", "MainSalesForm", CaseMainSalesForm);
```

### Shared `business/` logic

Cross-entity business rules (e.g. audit helpers, permission checks) that are reused across entity modules belong in `src/shared/business/` rather than duplicated inside each entity module.
