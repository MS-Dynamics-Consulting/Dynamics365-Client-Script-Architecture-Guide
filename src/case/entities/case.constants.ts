/**
 * Case entity constants and enumerations
 * Combines field names, status codes, option sets, and GUID constants
 */
export const CaseConstants = {
    /**
     * Entity logical name
     */
    LogicalName: "incident",

    /**
     * Entity set name (for Web API)
     */
    EntitySetName: "incidents",

    /**
     * Field logical names
     */
    Fields: {
        // Primary fields
        CaseId: "incidentid",
        Name: "title",
        CaseNumber: "ticketnumber",

        // Status fields
        StateCode: "statecode",
        StatusCode: "statuscode",

        // Contact/Customer fields
        Contact: "customerid",
        Account: "customerid",

        // Service fields
        Service: "msdc_service",
        ServiceType: "msdc_servicetype",
        SupportOption: "msdc_supportoption",

        // Sales fields
        SalesRegion: "msdc_salesregion",
        Commission: "msdc_commission",
        Revenue: "msdc_revenue",
        SalesManager: "msdc_salesmanager",

        // Address fields
        EnquirerPostcode: "msdc_enquirerpostcode",
        EnquirerPostcodePrefix: "msdc_enquirerpostcodeprefix",

        // Audit fields
        CreatedOn: "createdon",
        ModifiedOn: "modifiedon"
    } as const,

    /**
     * State codes
     */
    StateCode: {
        Active: 0,
        Inactive: 1
    } as const,

    /**
     * Status code enumeration
     */
    StatusCode: {
        // Active statuses
        Active: 1,
        Draft: 100000000,
        InProgress: 100000001,
        PendingReview: 100000002,

        // Closed statuses
        Resolved: 2,
        Cancelled: 100000003
    } as const,

    /**
     * Form IDs (for form routing if needed)
     */
    FormIds: {
        Main: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        QuickCreate: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    } as const
} as const;

/**
 * Type exports for better intellisense
 */
export type CaseStatusCode = typeof CaseConstants.StatusCode[keyof typeof CaseConstants.StatusCode];
export type CaseStateCode = typeof CaseConstants.StateCode[keyof typeof CaseConstants.StateCode];
export type CaseFields = typeof CaseConstants.Fields[keyof typeof CaseConstants.Fields];
