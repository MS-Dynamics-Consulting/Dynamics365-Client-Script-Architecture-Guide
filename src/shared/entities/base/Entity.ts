export abstract class Entity {
    id?: string;

    constructor(id?: string) {
        this.id = id;
    }

    // common methods for all entities
    toString(): string {
        return `${this.constructor.name}:${this.id}`;
    }
}