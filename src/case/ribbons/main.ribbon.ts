export const CaseMainRibbon = {
    openNewCase: () => {
        console.log("Ribbon button: open new case");
    }
} as const;

if (typeof window !== "undefined") {
    window.MSDC = window.MSDC || {};
    window.MSDC.Case = window.MSDC.Case || {};
    window.MSDC.Case.MainRibbon = CaseMainRibbon;
}