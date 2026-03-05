import { Entity } from "./base/entity";

export class EnvironmentVariableEntity extends Entity {
    static LogicalName = "environmentvariabledefinition";

    schemaname?: string;
    defaultvalue?: string | null;
    environmentvariabledefinition_environmentvariablevalue?: Array<{ value: string }>;
}
