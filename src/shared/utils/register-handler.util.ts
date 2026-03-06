export function registerHandler(entity: string, name: string, handler: object): void {
    if (typeof window === "undefined") return;
    window.MSDC ??= {};
    window.MSDC[entity] ??= {};
    window.MSDC[entity][name] = handler;
}
