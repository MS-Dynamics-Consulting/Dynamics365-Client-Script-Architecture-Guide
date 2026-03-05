/**
 * Environment variable schema names registered in Dynamics 365.
 * Centralised here to avoid magic strings across the codebase.
 */
export const EnvironmentVariables = {
    Case: {
        Configuration: "msdc_CaseConfiguration",
        StatusAppURL: "msdc_CaseStatusAppURL"
    }
} as const;
