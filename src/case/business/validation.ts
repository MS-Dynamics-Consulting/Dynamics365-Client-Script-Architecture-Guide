import { CaseEntity } from "../entities/case.entity";

/**
 * Case validation business logic
 * Reusable validation functions used across multiple forms
 */
export const CaseValidation = {
    /**
     * Validate subject selection
     */
    validateSubject: (formContext: Xrm.FormContext): boolean => {
        const subject = formContext
            .getAttribute(CaseEntity.Fields.Subject)
            ?.getValue();

        if (!subject || (Array.isArray(subject) && subject.length === 0)) {
            Xrm.Navigation.openAlertDialog({
                text: "Please select a subject before saving."
            });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Subject)?.setFocus();
            return false;
        }

        return true;
    },

    /**
     * Validate customer selection
     */
    validateCustomer: (formContext: Xrm.FormContext): boolean => {
        const customer = formContext
            .getAttribute(CaseEntity.Fields.Customer)
            ?.getValue();

        if (!customer || (Array.isArray(customer) && customer.length === 0)) {
            Xrm.Navigation.openAlertDialog({
                text: "Please select a customer before saving."
            });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseEntity.Fields.Customer)?.setFocus();
            return false;
        }

        return true;
    }
} as const;
