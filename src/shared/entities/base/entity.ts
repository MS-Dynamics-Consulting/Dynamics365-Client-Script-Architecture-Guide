export abstract class Entity {
    readonly id?: string;

    constructor(id?: string) {
        this.id = id;
    }
}