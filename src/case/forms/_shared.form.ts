import { CaseConstants } from "../entities/case.constants";
import { CaseValidation } from "../business/validation";
import { CaseWorkflow } from "../business/workflow";
import { GetEnvironmentVariableValue } from "../../shared/utils/xrm.util";

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
        return CaseValidation.validateService(formContext) &&
               CaseValidation.validateContact(formContext);
    },

    /**
     * Update fields based on service selection — used by multiple forms
     */
    updateFieldsForService: async (formContext: Xrm.FormContext): Promise<void> => {
        await CaseWorkflow.updateFieldsBasedOnService(formContext);
    },

    /**
     * Toggle childhood stroke subgrid — used by service and manager forms
     */
    toggleChildhoodStrokeSubgrid: async (formContext: Xrm.FormContext): Promise<void> => {
        await CaseWorkflow.toggleChildhoodStrokeSubgrid(formContext);
    }
} as const;

// ============================================================================
// Private helper functions
// ============================================================================

function registerCommonEventHandlers(formContext: Xrm.FormContext): void {
    formContext
        .getAttribute(CaseConstants.Fields.Service)
        ?.addOnChange(() => SharedFormLogic.updateFieldsForService(formContext));

    formContext
        .getAttribute(CaseConstants.Fields.EnquirerPostcode)
        ?.addOnChange(() => populatePostcodePrefix(formContext));
}

async function loadEnvironmentConfiguration(formContext: Xrm.FormContext): Promise<void> {
    const config = await GetEnvironmentVariableValue("sa_CaseConfiguration");
    if (config) {
        applyConfiguration(formContext, config);
    }
}

function applyCommonFieldRules(formContext: Xrm.FormContext): void {
    formContext
        .getAttribute(CaseConstants.Fields.Service)
        ?.setRequiredLevel("required");

    formContext
        .getAttribute(CaseConstants.Fields.Contact)
        ?.setRequiredLevel("required");
}

function populatePostcodePrefix(formContext: Xrm.FormContext): void {
    const postcode = formContext
        .getAttribute<Xrm.Attributes.StringAttribute>(CaseConstants.Fields.EnquirerPostcode)
        ?.getValue();

    const postcodePrefix = postcode?.substring(0, 4);

    formContext
        .getAttribute(CaseConstants.Fields.EnquirerPostcodePrefix)
        ?.setValue(postcodePrefix ?? null);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function applyConfiguration(_formContext: Xrm.FormContext, _config: string): void {
    // Apply environment-specific configuration
}
