import { CaseConstants } from "../entities/case.constants";

/**
 * Case validation business logic
 * Reusable validation functions used across multiple forms
 */
export const CaseValidation = {
    /**
     * Validate service selection
     */
    validateService: (formContext: Xrm.FormContext): boolean => {
        const service = formContext
            .getAttribute(CaseConstants.Fields.Service)
            ?.getValue();

        if (!service || (Array.isArray(service) && service.length === 0)) {
            Xrm.Navigation.openAlertDialog({
                text: "Please select a service before saving."
            });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.Service)?.setFocus();
            return false;
        }

        return true;
    },

    /**
     * Validate contact selection
     */
    validateContact: (formContext: Xrm.FormContext): boolean => {
        const contact = formContext
            .getAttribute(CaseConstants.Fields.Contact)
            ?.getValue();

        if (!contact || (Array.isArray(contact) && contact.length === 0)) {
            Xrm.Navigation.openAlertDialog({
                text: "Please select a contact before saving."
            });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.Contact)?.setFocus();
            return false;
        }

        return true;
    },

    /**
     * Validate sales-specific fields
     */
    validateSalesFields: (formContext: Xrm.FormContext): boolean => {
        const revenue = formContext
            .getAttribute<Xrm.Attributes.NumberAttribute>(CaseConstants.Fields.Revenue)
            ?.getValue();

        if (revenue !== null && revenue !== undefined && revenue < 0) {
            Xrm.Navigation.openAlertDialog({
                text: "Revenue cannot be negative."
            });
            return false;
        }

        return true;
    },

    /**
     * Validate postcode format (UK)
     */
    validatePostcode: (formContext: Xrm.FormContext): boolean => {
        const postcode = formContext
            .getAttribute<Xrm.Attributes.StringAttribute>(CaseConstants.Fields.EnquirerPostcode)
            ?.getValue();

        if (!postcode) {
            return true; // Optional field
        }

        const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;

        if (!postcodeRegex.test(postcode)) {
            Xrm.Navigation.openAlertDialog({
                text: "Invalid postcode format. Please enter a valid UK postcode."
            });
            formContext.getControl<Xrm.Controls.StandardControl>(CaseConstants.Fields.EnquirerPostcode)?.setFocus();
            return false;
        }

        return true;
    }
} as const;
