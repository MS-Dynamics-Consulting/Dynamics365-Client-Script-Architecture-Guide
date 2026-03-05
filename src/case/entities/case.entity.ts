import { Entity } from "../../shared/entities/base/entity";

export class CaseEntity extends Entity {
    static logicalName = "incident";

    constructor(id?: string) {
        super(id);
    }

    // entity-specific properties can be added here
}
