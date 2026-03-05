/**
 * Case Module - Public API
 *
 * Import from this file instead of individual modules for better maintainability.
 */

// Entity exports
export { CaseEntity } from "./entities/case.entity";
export { CaseRepository } from "./entities/case.repository";
export type { CaseStatusCode, CaseStateCode, CaseFields } from "./entities/case.entity";

// Form handler exports
export { CaseMainSalesForm } from "./forms/main-sales.form";
export { CaseMainServiceForm } from "./forms/main-service.form";
export { CaseQuickCreateForm } from "./forms/quick-create.form";
// Note: _shared.form is NOT exported (internal use only)

// Ribbon handler exports
export { CaseMainRibbon } from "./ribbons/main.ribbon";

// Business logic exports
export { CaseValidation } from "./business/validation";
export { CaseWorkflow } from "./business/workflow";
