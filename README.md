# Dynamics 365 Client Script Architecture Guide

TypeScript reference architecture for D365 web resources.

## Table of Contents

- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Naming Conventions](#naming-conventions)
- [Entity Module Blueprint](#entity-module-blueprint)
- [Repository Pattern](#repository-pattern)
- [Form Handlers](#form-handlers)
- [Registration in Dynamics 365](#registration-in-dynamics-365)

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
├── shared/
│   ├── constants/
│   │   └── environment-variables.constants.ts
│   ├── entities/
│   │   └── base/
│   │       └── entity.ts
│   ├── repositories/
│   │   ├── repository.ts
│   │   └── environment-variable.repository.ts
│   ├── types/
│   │   └── xrm.d.ts
│   └── utils/
│       ├── register-handler.util.ts
│       └── xrm-context.util.ts
│
└── <entity>/
    ├── entities/
    │   ├── <entity>.entity.ts
    │   └── <entity>.repository.ts
    ├── forms/
    │   ├── _shared.form.ts          # shared logic — not registered in D365
    │   └── <variant>.form.ts
    ├── ribbons/
    │   └── main.ribbon.ts
    ├── business/
    │   ├── validation.ts
    │   └── workflow.ts
    └── index.ts
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

### Form handler naming

Pattern: `[Entity][FormType][Variant]Form`

| Segment | Values |
|---------|--------|
| Entity | PascalCase: `Case`, `Contact`, `Email` |
| FormType | `Main`, `QuickCreate`, `Mobile` |
| Variant | Optional: `Sales`, `Service`, `Manager` |

Examples: `CaseMainSalesForm`, `CaseQuickCreateForm`, `ContactMainForm`

Exports are **PascalCase `as const` objects** — one per file: `export const CaseMainSalesForm = { onLoad, onSave } as const;`

---

## Entity Module Blueprint

### Entity class

All entity metadata lives as `static` properties on the entity class — no separate constants file.

```ts
// case/entities/case.entity.ts
export class CaseEntity extends Entity {
    static LogicalName   = "incident";
    static EntitySetName = "incidents";

    // Static Fields — schema name strings used in queries and form controls
    static Fields = {
        CaseId:      "incidentid",
        Title:       "title",
        CaseNumber:  "ticketnumber",
        StateCode:   "statecode",
        StatusCode:  "statuscode",
        Customer:    "customerid",
        Subject:     "subjectid",
        Priority:    "prioritycode",
        Description: "description"
    } as const;

    static StateCode  = { Active: 0, Inactive: 1 } as const;

    static StatusCode = {
        Active: 1, InProgress: 100000001,
        PendingReview: 100000002, Resolved: 2, Cancelled: 100000003
    } as const;

    static FormIds = {
        Main:        "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        QuickCreate: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    } as const;

    // Instance attributes — typed field values returned by Xrm.WebApi
    title?:        string;
    ticketnumber?: string;
    statecode?:    CaseStateCode;
    statuscode?:   CaseStatusCode;
    customerid?:   string;
    subjectid?:    string;
    prioritycode?: number;
    description?:  string;
}

export type CaseStatusCode = typeof CaseEntity.StatusCode[keyof typeof CaseEntity.StatusCode];
export type CaseStateCode  = typeof CaseEntity.StateCode[keyof typeof CaseEntity.StateCode];
export type CaseFields     = typeof CaseEntity.Fields[keyof typeof CaseEntity.Fields];
```

### Adding a new entity

1. Create `src/<entity>/` following the folder structure.
2. Add entry points in `webpack.config.js`:
   ```js
   '<entity>/forms/main.form':     './src/<entity>/forms/main.form.ts',
   '<entity>/ribbons/main.ribbon': './src/<entity>/ribbons/main.ribbon.ts',
   ```
3. Create `src/<entity>/index.ts` with public re-exports.

---

## Repository Pattern

All `Xrm.WebApi` calls go through a repository — never directly from form handlers. The base class `Repository<T, TFields>` handles the Web API plumbing; you create a thin subclass per entity:

```ts
// case/entities/case.repository.ts
import { Repository }              from "../../shared/repositories/repository";
import { CaseEntity, CaseFields } from "./case.entity";

export class CaseRepository extends Repository<CaseEntity, CaseFields> {
    constructor() { super(CaseEntity); }
}
```

That's all a standard repository needs. `CaseEntity` provides `LogicalName` and `EntitySetName` to the base class automatically.

### Usage

```ts
const repo = new CaseRepository();

// Retrieve a single record — select is typed to CaseFields, unknown fields are compile errors
const record = await repo.retrieve(caseId, [CaseEntity.Fields.Title, CaseEntity.Fields.StatusCode]);
console.log(record.title, record.statuscode); // fully typed, no casts needed

// Query multiple records with OData
const select = [CaseEntity.Fields.Title, CaseEntity.Fields.StatusCode].join(",");
const openCases = await repo.retrieveMultiple(
    `?$select=${select}&$filter=statecode eq ${CaseEntity.StateCode.Active}`
);

// Create
const newId = await repo.create({ title: "Hardware issue", prioritycode: 1 } as CaseEntity);

// Update — only known attributes accepted
await repo.update(caseId, { statuscode: CaseEntity.StatusCode.InProgress });

// Delete
await repo.delete(caseId);
```

### N:N relationships — `associate` / `disassociate`

`Xrm.WebApi` has no native methods for N:N relationships. The base repository implements them via the OData `$ref` endpoint, which needs the **plural** API name — that's why every entity class declares `EntitySetName`:

```ts
// Link a case to a connection record
await repo.associate(
    caseId,
    "incident_connections1",  // navigation property name
    "connections",            // target EntitySetName
    connectionId
);

// Remove the link
await repo.disassociate(caseId, "incident_connections1", connectionId);
```

### Environment variables

D365 environment variables have their own built-in repository. Store schema names in a constants file and read them anywhere:

```ts
// shared/constants/environment-variables.constants.ts
export const EnvironmentVariables = {
    Case: {
        StatusAppURL: "msdc_CaseStatusAppURL"
    }
} as const;

// Usage in a form handler
const url = await new EnvironmentVariableRepository().getValue(
    EnvironmentVariables.Case.StatusAppURL
);
```

---

## Form Handlers

Each form variant has its own file. Shared logic lives in `_shared.form.ts` and is never registered directly in D365.

`registerHandler` (from `shared/utils/register-handler.util.ts`) populates `window.MSDC` at bundle load time — it replaces the manual `window.MSDC = window.MSDC || {}` block.

### `_shared.form.ts`

```ts
import { CaseValidation } from "../business/validation";

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
import { registerHandler }  from "../../shared/utils/register-handler.util";
import { CaseEntity }       from "../entities/case.entity";
import { SharedFormLogic }  from "./_shared.form";

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
    }
} as const;

function setupFieldVisibility(formContext: Xrm.FormContext): void {
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Priority)?.setVisible(true);
}

registerHandler("Case", "MainSalesForm", CaseMainSalesForm);
```

---

## Registration in Dynamics 365

### Form events

Open **Form Editor → Form Properties → Events → Form Libraries** → Add your `.js` web resource.

| Event | Handler function | Pass execution context |
|-------|-----------------|------------------------|
| OnLoad | `MSDC.Case.MainSalesForm.onLoad` | ✅ |
| OnSave | `MSDC.Case.MainSalesForm.onSave` | ✅ |
| OnChange | `MSDC.Case.MainSalesForm.<handlerName>` | ✅ |

### Ribbon / Command Bar

Use **Ribbon Workbench** or **Command Designer**. Set the function to `MSDC.Case.MainRibbon.openNewCase` and pass execution context.

### Build output → web resource mapping

| Entry point | Compiled output |
|-------------|----------------|
| `case/forms/main-sales.form.ts` | `dist/case/forms/main-sales.form.js` |
| `case/forms/main-service.form.ts` | `dist/case/forms/main-service.form.js` |
| `case/forms/quick-create.form.ts` | `dist/case/forms/quick-create.form.js` |
| `case/ribbons/main.ribbon.ts` | `dist/case/ribbons/main.ribbon.js` |
