// lightweight helper for accessing Xrm context
export function getFormContext(executionContext: Xrm.Events.EventContext): Xrm.FormContext {
    return executionContext.getFormContext();
}

/**
 * Retrieve an environment variable value by schema name via Web API
 */
export async function GetEnvironmentVariableValue(schemaName: string): Promise<string | null> {
    try {
        const result = await Xrm.WebApi.retrieveMultipleRecords(
            "environmentvariabledefinition",
            `?$select=defaultvalue&$filter=schemaname eq '${schemaName}'&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)`
        );

        if (!result.entities || result.entities.length === 0) {
            return null;
        }

        const definition = result.entities[0] as Record<string, unknown>;
        const values = definition["environmentvariabledefinition_environmentvariablevalue"] as Array<{ value: string }> | undefined;

        if (values && values.length > 0) {
            return values[0].value;
        }

        return (definition.defaultvalue as string) ?? null;
    } catch {
        return null;
    }
}