import { CaseEntity } from "../entities/case.entity";
import { CaseValidation } from "../business/validation";
import { CaseWorkflow } from "../business/workflow";
import { EnvironmentVariableRepository } from "../../shared/repositories/environment-variable.repository";
import { EnvironmentVariables } from "../../shared/constants/environment-variables.constants";

/**
 * Shared form logic used across multiple Case forms
 *
 * Note: Prefix with underscore (_) to indicate this is not a direct form handler.
 * This file should not be registered directly in Dynamics 365 forms.
 */
export const SharedFormLogic = {
    /**
     * Common initialization logic for all Case forms
     */
    initializeForm: async (formContext: Xrm.FormContext): Promise<void> => {
        registerCommonEventHandlers(formContext);
        await loadEnvironmentConfiguration(formContext);
        applyCommonFieldRules(formContext);
    },

    /**
     * Common validation used by all forms
     */
    validateCommonFields: (formContext: Xrm.FormContext): boolean => {
        return CaseValidation.validateSubject(formContext) &&
               CaseValidation.validateCustomer(formContext);
    },

    /**
     * Update fields based on service selection — used by multiple forms
     */
    updateFieldsForService: async (formContext: Xrm.FormContext): Promise<void> => {
        await CaseWorkflow.updateFieldsBasedOnService(formContext);
    }
} as const;

// ============================================================================
// Private helper functions
// ============================================================================

function registerCommonEventHandlers(formContext: Xrm.FormContext): void {
    formContext
        .getAttribute(CaseEntity.Fields.Subject)
        ?.addOnChange(() => SharedFormLogic.updateFieldsForService(formContext));
}

async function loadEnvironmentConfiguration(formContext: Xrm.FormContext): Promise<void> {
    const config = await new EnvironmentVariableRepository().getValue(EnvironmentVariables.Case.Configuration);
    if (config) {
        applyConfiguration(formContext, config);
    }
}

function applyCommonFieldRules(formContext: Xrm.FormContext): void {
    formContext
        .getAttribute(CaseEntity.Fields.Subject)
        ?.setRequiredLevel("required");

    formContext
        .getAttribute(CaseEntity.Fields.Customer)
        ?.setRequiredLevel("required");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function applyConfiguration(_formContext: Xrm.FormContext, _config: string): void {
    // Apply environment-specific configuration
}
