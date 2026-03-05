import { EnvironmentVariableEntity } from "../entities/environment-variable.entity";
import { Repository } from "./repository";

/**
 * Repository for reading Dynamics 365 environment variable values.
 *
 * @example
 * const appUrl = await new EnvironmentVariableRepository().getValue("msdc_MyVariableName");
 */
export class EnvironmentVariableRepository extends Repository<EnvironmentVariableEntity> {
    constructor() {
        super(EnvironmentVariableEntity);
    }

    /**
     * Retrieve the resolved value of an environment variable by schema name.
     * Returns the current value if set, falls back to the default value, or null if not found.
     */
    async getValue(schemaName: string): Promise<string | null> {
        try {
            const results = await this.retrieveMultiple(
                `?$select=defaultvalue&$filter=schemaname eq '${schemaName}'&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)`
            );

            if (!results || results.length === 0) return null;

            const definition = results[0];
            const values = definition.environmentvariabledefinition_environmentvariablevalue;

            if (values && values.length > 0) return values[0].value;

            return definition.defaultvalue ?? null;
        } catch {
            return null;
        }
    }
}
