import { CaseEntity } from "../entities/case.entity";
import { SharedFormLogic } from "./_shared.form";
import { registerHandler } from "../../shared/utils/register-handler.util";

/**
 * Case Quick Create Form
 *
 * Form Details:
 * - Form Name: "Quick Create"
 * - Form ID: {cccccccc-cccc-cccc-cccc-cccccccccccc}
 * - Target Audience: All users
 * - Security Role: All roles with case creation rights
 *
 * Features:
 * - Minimal field set for fast case creation
 * - Common validation on save
 */
export const CaseQuickCreateForm = {
    /**
     * Form load event handler
     * Registered as: OnLoad event in Dynamics 365
     */
    onLoad: (executionContext: Xrm.Events.EventContext): void => {
        const formContext = executionContext.getFormContext();
        applyQuickCreateFieldRules(formContext);
    },

    /**
     * Form save event handler
     * Registered as: OnSave event in Dynamics 365
     */
    onSave: (executionContext: Xrm.Events.SaveEventContext): void => {
        const formContext = executionContext.getFormContext();

        if (!SharedFormLogic.validateCommonFields(formContext)) {
            executionContext.getEventArgs().preventDefault();
        }
    }
} as const;

// ============================================================================
// Private helper functions
// ============================================================================

function applyQuickCreateFieldRules(formContext: Xrm.FormContext): void {
    formContext
        .getAttribute(CaseEntity.Fields.Subject)
        ?.setRequiredLevel("required");

    formContext
        .getAttribute(CaseEntity.Fields.Customer)
        ?.setRequiredLevel("required");
}

// ============================================================================
// Global registration for Dynamics 365
// ============================================================================

if (typeof window !== "undefined") {
    registerHandler("Case", "QuickCreateForm", CaseQuickCreateForm);
}
