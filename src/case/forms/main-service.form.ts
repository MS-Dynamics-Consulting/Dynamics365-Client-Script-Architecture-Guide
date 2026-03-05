import { CaseConstants } from "../entities/case.constants";
import { SharedFormLogic } from "./_shared.form";
import { GetEnvironmentVariableValue } from "../../shared/utils/xrm.util";

/**
 * Case Main Form - Service View
 *
 * Form Details:
 * - Form Name: "Main - Service"
 * - Form ID: {bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb}
 * - Target Audience: Service delivery team
 * - Security Role: Service Coordinator, Service Manager
 *
 * Features:
 * - Service field visibility rules
 * - Contact status app iframe
 * - Childhood stroke subgrid toggle
 */
export const CaseMainServiceForm = {
    /**
     * Form load event handler
     * Registered as: OnLoad event in Dynamics 365
     */
    onLoad: async (executionContext: Xrm.Events.EventContext): Promise<void> => {
        const formContext = executionContext.getFormContext();

        await SharedFormLogic.initializeForm(formContext);
        await toggleContactStatusApp(formContext);
        await SharedFormLogic.toggleChildhoodStrokeSubgrid(formContext);
        setupServiceFieldVisibility(formContext);
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

async function toggleContactStatusApp(formContext: Xrm.FormContext): Promise<void> {
    const appUrl = await GetEnvironmentVariableValue("sa_CaseStatusAppURL");
    const iframe = formContext.getControl<Xrm.Controls.IframeControl>("IFRAME_CaseContactStatusApp");

    if (appUrl && iframe) {
        iframe.setSrc(appUrl);
    }
}

function setupServiceFieldVisibility(formContext: Xrm.FormContext): void {
    formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.ServiceType)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.SupportOption)?.setVisible(true);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.SalesRegion)?.setVisible(false);
    formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.Commission)?.setVisible(false);
}

// ============================================================================
// Global registration for Dynamics 365
// ============================================================================

if (typeof window !== "undefined") {
    window.MSDC = window.MSDC || {};
    window.MSDC.Case = window.MSDC.Case || {};
    window.MSDC.Case.MainServiceForm = CaseMainServiceForm;
}
