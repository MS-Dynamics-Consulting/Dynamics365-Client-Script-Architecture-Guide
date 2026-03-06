import { registerHandler } from "../../shared/utils/register-handler.util";

export const CaseMainRibbon = {
    openNewCase: () => {
        console.log("Ribbon button: open new case");
    }
} as const;

if (typeof window !== "undefined") {
    registerHandler("Case", "MainRibbon", CaseMainRibbon);
}