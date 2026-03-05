# Dynamics 365 Client Script Architecture Guide

A reference architecture for organizing Dynamics 365 client-side scripts (web resources) in TypeScript. Defines naming standards, folder structure, code patterns, and conventions for scalable, maintainable D365 projects.

## Table of Contents

- [Getting Started](#getting-started)
- [Folder Structure](#folder-structure)
- [Naming Conventions](#naming-conventions)
- [Form Handler Patterns](#form-handler-patterns)
- [Entity Module Blueprint](#entity-module-blueprint)
- [Repository Pattern](#repository-pattern)
- [Code Patterns](#code-patterns)
- [Registration in Dynamics 365](#registration-in-dynamics-365)
- [Best Practices](#best-practices)

---

## Getting Started

Install dependencies and run the build:

```bash
npm install
npm run build        # production build
npm run build:dev    # development build with source maps
```

The compiled output is in `dist/`. Each deployable web resource compiles to its own `.js` file — one per form and ribbon. Use `npm run clean` to delete generated files.

**Tech stack:**
- TypeScript (strict mode, ES5 target)
- Webpack 5 with multi-entry builds
- `@types/xrm` for Dynamics 365 type definitions

---

## Folder Structure

```
src/
├── shared/                        # Shared infrastructure & utilities
│   ├── entities/                  # Shared base entities
│   │   └── base/
│   │       └── entity.ts          # Abstract Entity base class
│   ├── repositories/              # Generic data-access base class
│   │   └── repository.ts          # Repository<T> + IRepository<T>
│   ├── types/                     # TypeScript definitions
│   │   └── xrm.d.ts               # Window.MSDC global extension
│   └── utils/                     # Common utility functions
│       └── get-xrm-context.ts     # Safe Xrm accessor (handles iframes)
│
├── <entity-name>/                 # Per-entity module (e.g., case/)
│   ├── entities/                  # Entity-specific classes & constants
│   ├── forms/                     # Form handlers by variant
│   ├── ribbons/                   # Ribbon / command bar handlers
│   ├── pages/                     # Custom pages / HTML resources
│   ├── dialogs/                   # Dialog or quick-form handlers
│   ├── business/                  # Business logic (validation, workflows)
│   └── index.ts                   # Public API for the module
```

**Key points:**
1. Keep shared code under `shared/` to avoid duplication.
2. Each entity has a self-contained module; add new entities as new folders.
3. Form handlers are granular and named by form type/variant.
4. Non-form resources (ribbons, pages, dialogs) live alongside forms.
5. `index.ts` files export the public API for easy imports.

---

## Naming Conventions

### Files

Use `lowercase-with-dashes.type.ts` for all file names.

✅ **Good:**
```
case.entity.ts
case.repository.ts
case.constants.ts
main-sales.form.ts
quick-create.form.ts
main.ribbon.ts
status-app.page.ts
update-category.dialog.ts
_shared.form.ts
```

❌ **Avoid:**
```
Case.Form.ts
Case.Commandbar.ts
CaseMainForm.ts
Sms.Form.SA.ts
```

### Exports and Symbols

Prefer **PascalCase object exports** for handlers. Group related functions into a single `as const` object.

```ts
// ✅ Good
export const CaseMainSalesForm = { onLoad, onSave, onServiceChange } as const;
export const CaseMainRibbon = { openNewCase } as const;

// ❌ Bad
export function onLoad() { }
export function onSave() { }
```

### Form Handler Naming

Pattern: `[Entity][FormType][Variant]Form`

| Segment | Values |
|---------|--------|
| Entity | PascalCase entity name: `Case`, `Email`, `Contact` |
| FormType | `Main`, `QuickCreate`, `Mobile` |
| Variant | Optional: `Sales`, `Service`, `Manager` |

Examples: `CaseMainSalesForm`, `CaseQuickCreateForm`, `EmailMainForm`, `ContactMobileForm`

### Other Resources

| Resource type  | Naming pattern                                  |
|----------------|-------------------------------------------------|
| Ribbon         | `main.ribbon.ts`, `subgrid.ribbon.ts`           |
| Page           | `<feature>.page.ts`                             |
| Dialog         | `<action>.dialog.ts`                            |
| Business logic | `validation.ts`, `workflow.ts`                  |
| Entities       | `case.entity.ts`, `case.repository.ts` |

---

## Form Handler Patterns

**Named form handlers** are the foundation of this architecture. Each form variant gets its own handler file.

### Benefits
- Explicit form-to-code mapping
- Clean separation when multiple forms exist for the same entity
- Easier to test and maintain
- Good TypeScript support
- Straightforward Dynamics 365 registration

### Shared Logic

Place logic common to multiple forms in `_shared.form.ts`. **Do not register this file directly in Dynamics 365.**

```ts
// src/case/forms/_shared.form.ts
export const SharedFormLogic = {
    initializeForm: async (formContext: Xrm.FormContext): Promise<void> => {
        // Common event handlers, env vars, field rules, subgrid setup
    },
    validateCommonFields: (formContext: Xrm.FormContext): boolean => {
        return CaseValidation.validateService(formContext) &&
               CaseValidation.validateContact(formContext);
    },
    updateFieldsForService: async (formContext: Xrm.FormContext): Promise<void> => {
        await CaseWorkflow.updateFieldsBasedOnService(formContext);
    }
} as const;
```

### Form Variant Example

```ts
// src/case/forms/main-sales.form.ts

/**
 * Case Main Form - Sales View
 *
 * Form Details:
 * - Form Name: "Main - Sales"
 * - Form ID: {12345678-1234-1234-1234-123456789012}
 * - Target Audience: Sales team members
 * - Security Role: Sales Representative, Sales Manager
 */
export const CaseMainSalesForm = {
    onLoad: async (executionContext: Xrm.Events.EventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();
        await SharedFormLogic.initializeForm(formContext);
        await loadSalesMetrics(formContext);
        setupSalesFieldVisibility(formContext);
        registerSalesEventHandlers(formContext);
    },

    onSave: async (executionContext: Xrm.Events.SaveEventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();
        if (!SharedFormLogic.validateCommonFields(formContext) ||
            !CaseValidation.validateSalesFields(formContext)) {
            executionContext.getEventArgs().preventDefault();
        }
    },

    onServiceChange: async (executionContext: Xrm.Events.EventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();
        await updateSalesCommission(formContext);
    }
} as const;

// ============================================================================
// Private helpers (not exported)
// ============================================================================

async function loadSalesMetrics(formContext: Xrm.FormContext): Promise<void> {
    const repository = new CaseRepository();
    const caseData = await repository.retrieve(formContext.data.entity.getId(), [
        CaseEntity.Fields.Subject,
        CaseEntity.Fields.Priority,
        CaseEntity.Fields.Owner
    ]);
    if (caseData) displaySalesMetrics(formContext, caseData);
}

function setupSalesFieldVisibility(formContext: Xrm.FormContext): void {
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Priority)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.CaseType)?.setVisible(false);
}

// ============================================================================
// Global registration for Dynamics 365
// ============================================================================

if (typeof window !== "undefined") {
    window.MSDC = window.MSDC || {};
    window.MSDC.Case = window.MSDC.Case || {};
    window.MSDC.Case.MainSalesForm = CaseMainSalesForm;
}
```

---

## Entity Module Blueprint

Each entity module follows a consistent template:

```
case/
├── entities/
│   ├── case.entity.ts          # Entity class with static LogicalName, Fields, StatusCode, FormIds
│   └── case.repository.ts      # CaseRepository extends Repository<CaseEntity>
├── forms/
│   ├── main-sales.form.ts
│   ├── main-service.form.ts
│   ├── quick-create.form.ts
│   └── _shared.form.ts         # Internal — not registered in D365
├── ribbons/
│   └── main.ribbon.ts
├── pages/
│   └── status-app.page.ts
├── dialogs/
│   └── update-category.dialog.ts
├── business/
│   ├── validation.ts
│   └── workflow.ts
└── index.ts                    # Public API re-exports
```

### `index.ts` structure

```ts
// case/index.ts
export { CaseEntity } from "./entities/case.entity";
export { CaseRepository } from "./entities/case.repository";
export type { CaseStatusCode, CaseStateCode, CaseFields } from "./entities/case.entity";

export { CaseMainSalesForm }   from "./forms/main-sales.form";
export { CaseMainServiceForm } from "./forms/main-service.form";
export { CaseQuickCreateForm } from "./forms/quick-create.form";
// Note: _shared.form.ts is NOT exported (internal use only)

export { CaseMainRibbon }  from "./ribbons/main.ribbon";
export { CaseValidation }  from "./business/validation";
export { CaseWorkflow }    from "./business/workflow";
```

### Entity static properties

All entity metadata lives as `static` properties directly on the entity class — no separate constants file.

```ts
// case/entities/case.entity.ts
export class CaseEntity extends Entity {
    static LogicalName = "incident";

    static Fields = {
        CaseId:     "incidentid",
        Title:      "title",
        CaseNumber: "ticketnumber",
        StateCode:  "statecode",
        StatusCode: "statuscode",
        Customer:   "customerid",
        Subject:    "subjectid",
        CaseType:   "casetypecode",
        Origin:     "caseorigincode",
        Priority:   "prioritycode",
        Owner:      "ownerid",
        Description: "description"
    } as const;

    static StateCode = {
        Active: 0,
        Inactive: 1
    } as const;

    static StatusCode = {
        Active: 1,
        Draft: 100000000,
        InProgress: 100000001,
        PendingReview: 100000002,
        Resolved: 2,
        Cancelled: 100000003
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

---

## Repository Pattern

All data access extends the shared `Repository<T>` base class, which wraps `Xrm.WebApi` with typed CRUD operations.

### Base entity

```ts
// src/shared/entities/base/entity.ts
export abstract class Entity {
    readonly id?: string;
}
```

### Base repository

```ts
// src/shared/repositories/repository.ts

export interface IRepository<T extends Entity> {
    retrieve(id: string, select?: string[], expand?: string[]): Xrm.Async.PromiseLike<T>;
    retrieveMultiple(query?: string): Xrm.Async.PromiseLike<T[]>;
    create(entity: T): Xrm.Async.PromiseLike<string>;
    update(id: string, entity: Partial<T>): Xrm.Async.PromiseLike<void>;
    delete(id: string): Xrm.Async.PromiseLike<string>;
}

type EntityConstructor<T> = { new(...args: any[]): T; LogicalName: string; };

export abstract class Repository<T extends Entity> implements IRepository<T> {
    private readonly entityLogicalName: string;
    private readonly xrm: typeof Xrm;

    constructor(entityType: EntityConstructor<T>) {
        this.entityLogicalName = entityType.LogicalName;
        this.xrm = getXrmContext();
    }
    // retrieve, retrieveMultiple, create, update, delete...
}
```

### Entity class

The entity class declares `static logicalName` — this is how the repository discovers the API endpoint without any configuration in the repository subclass.

```ts
// case/entities/case.entity.ts
export class CaseEntity extends Entity {
    static LogicalName = "incident";
    // typed properties...
}
```

### Repository subclass

```ts
// case/entities/case.repository.ts
export class CaseRepository extends Repository<CaseEntity> {
    constructor() { super(CaseEntity); }
}
```

### `getXrmContext` utility

Resolves the `Xrm` global safely in both top-level and iframe web resource contexts:

```ts
// src/shared/utils/get-xrm-context.ts
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
// case/business/validation.ts
export const CaseValidation = {
    validateSubject: (formContext: Xrm.FormContext): boolean => {
        const subject = formContext.getAttribute(CaseEntity.Fields.Subject)?.getValue();
        if (!subject || (subject as any[]).length === 0) {
            Xrm.Navigation.openAlertDialog({ text: "Please select a subject before saving." });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setFocus();
            return false;
        }
        return true;
    },
    validateCustomer: (formContext: Xrm.FormContext): boolean => {
        const customer = formContext.getAttribute(CaseEntity.Fields.Customer)?.getValue();
        if (!customer || (customer as any[]).length === 0) {
            Xrm.Navigation.openAlertDialog({ text: "Please select a customer before saving." });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Customer)?.setFocus();
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
    await loadSalesMetrics(formContext);
} catch (error) {
    console.error("Failed to load sales metrics:", error);
    Xrm.Navigation.openAlertDialog({ text: "Unable to load sales metrics. Please refresh the form." });
}

// ❌ DON'T
await loadSalesMetrics(formContext).catch(() => {});   // silent failure
await loadSalesMetrics(formContext).catch(e => alert(e.message));  // alert() in D365
```

### TypeScript usage

```ts
// ✅ DO
const formContext: Xrm.FormContext = executionContext.getFormContext();
const attr = formContext.getAttribute<Xrm.Attributes.LookupAttribute>(CaseEntity.Fields.Subject);
formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setVisible(true);

// ❌ DON'T
const formContext: any = executionContext.getFormContext();
const attr = formContext.getAttribute("subjectid");
```

---

## Registration in Dynamics 365

### Form event registration

Open Form Editor → **Form Properties** → **Events** → **Form Libraries** → Add Library.

| Event | Function | Pass execution context |
|-------|----------|------------------------|
| OnLoad  | `MSDC.Case.MainSalesForm.onLoad`  | ✅ |
| OnSave  | `MSDC.Case.MainSalesForm.onSave`  | ✅ |
| OnChange (field) | `MSDC.Case.MainSalesForm.onServiceChange` | ✅ |

### Ribbon / CommandBar registration

Use Ribbon Workbench or Command Designer:

- **Library**: `dist/case/ribbons/main.ribbon.js`
- **Function**: `MSDC.Case.MainRibbon.openNewCase`
- **Pass primary control**: ✅ (if the command needs record context)

### Build output → Library mapping

Each webpack entry produces one library file:

| Source file | dist output | D365 Library |
|-------------|-------------|--------------|
| `case/forms/main-sales.form.ts` | `dist/case/forms/main-sales.form.js` | Upload as web resource |
| `case/forms/main-service.form.ts` | `dist/case/forms/main-service.form.js` | Upload as web resource |
| `case/forms/quick-create.form.ts` | `dist/case/forms/quick-create.form.js` | Upload as web resource |
| `case/ribbons/main.ribbon.ts` | `dist/case/ribbons/main.ribbon.js` | Upload as web resource |

---

## Best Practices

### Form handlers
- **One handler per form variant.** Do not overload a single file with logic for multiple forms.
- **Document form metadata** (form ID, target audience, security roles) in JSDoc at the top of every handler.
- **Extract shared logic** to `_shared.form.ts`; never register it directly in Dynamics.

### Code organisation
- **Favor constants over magic strings.** All field names, GUIDs, and option set values live as `static` properties on the entity class (`CaseEntity.Fields`, `CaseEntity.StatusCode`, etc.) — no separate constants file needed.
- **Use `as const`** on all constants objects for full type narrowing.
- **Keep side-effects minimal.** Use repositories for all data access; keep form handlers thin.

### TypeScript
- **Enable strict mode.** All type errors must be resolved — do not cast to `any` to suppress them.
- **Use `@types/xrm`** (the official npm package) instead of hand-written Xrm declarations.
- **Use `Xrm.Controls.StandardControl`** when calling `setVisible()` or `setFocus()`.

### Build
- **One JS file per deployable web resource.** `webpack.config.js` uses explicit entry points; `splitChunks` is disabled.
- **No `.d.ts` output.** Declaration files are unnecessary for D365 web resources (`declaration: true` is omitted from `tsconfig.json`).
- **Source maps** are included in dev builds for in-browser debugging.

### Adding a new entity

1. Create `src/<entity>/` following the blueprint above.
2. Add entry points to `webpack.config.js`:
   ```js
   '<entity>/forms/main.form': './src/<entity>/forms/main.form.ts',
   '<entity>/ribbons/main.ribbon': './src/<entity>/ribbons/main.ribbon.ts',
   ```
3. Re-export from `src/<entity>/index.ts`.
