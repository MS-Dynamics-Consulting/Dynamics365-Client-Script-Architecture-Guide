import { CaseConstants } from "../entities/case.constants";

/**
 * Case workflow business logic
 * Orchestration and field-update functions shared across forms
 */
export const CaseWorkflow = {
    /**
     * Update dependent fields when the service lookup changes
     */
    updateFieldsBasedOnService: async (formContext: Xrm.FormContext): Promise<void> => {
        const service = formContext
            .getAttribute(CaseConstants.Fields.Service)
            ?.getValue();

        if (!service || (Array.isArray(service) && service.length === 0)) {
            return;
        }

        // Add service-specific field update logic here
        console.log("Service changed, updating fields", formContext.data.entity.getId());
    },

    /**
     * Toggle visibility of childhood-stroke subgrid based on service
     */
    toggleChildhoodStrokeSubgrid: async (formContext: Xrm.FormContext): Promise<void> => {
        const service = formContext
            .getAttribute(CaseConstants.Fields.Service)
            ?.getValue() as Array<{ id: string }> | null;

        const isVisible = Array.isArray(service) && service.length > 0;

        formContext
            .getControl<Xrm.Controls.StandardControl>("Subgrid_ChildhoodStroke")
            ?.setVisible(isVisible);
    }
} as const;
