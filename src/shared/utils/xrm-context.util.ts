export function getXrmContext(): typeof Xrm {
    if (typeof Xrm !== "undefined") {
        return Xrm;
    }

    const parentXrm = (window?.parent as unknown as Record<string, unknown>)?.["Xrm"];
    if (parentXrm) {
        return parentXrm as typeof Xrm;
    }

    throw new Error("Xrm context is not available.");
}
