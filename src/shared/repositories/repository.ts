import { Entity } from "../entities/base/entity";
import { getXrmContext } from "../utils/get-xrm-context";

export interface IRepository<T extends Entity> {
    retrieve(id: string, select?: string[], expand?: string[]): Xrm.Async.PromiseLike<T>;
    retrieveMultiple(query?: string): Xrm.Async.PromiseLike<T[]>;
    create(entity: T): Xrm.Async.PromiseLike<string>;
    update(id: string, entity: Partial<T>): Xrm.Async.PromiseLike<void>;
    delete(id: string): Xrm.Async.PromiseLike<string>;
}

type EntityConstructor<T extends Entity> = {
    new (...args: any[]): T;
    LogicalName: string;
};

/**
 * Base repository providing generic CRUD operations via Xrm.WebApi.
 * Extend this class, passing the entity constructor to super().
 *
 * @template T - Entity type managed by this repository
 *
 * @example
 * export class CaseRepository extends Repository<CaseEntity> {
 *     constructor() { super(CaseEntity); }
 * }
 */
export abstract class Repository<T extends Entity> implements IRepository<T> {
    private readonly entityLogicalName: string;
    private readonly xrm: typeof Xrm;

    constructor(entityType: EntityConstructor<T>) {
        this.entityLogicalName = entityType.LogicalName;
        this.xrm = getXrmContext();
    }

    retrieve(id: string, select?: string[], expand?: string[]): Xrm.Async.PromiseLike<T> {
        const parts: string[] = [];
        if (select && select.length > 0) parts.push(`$select=${select.join(",")}`);
        if (expand && expand.length > 0) parts.push(`$expand=${expand.join(",")}`);
        const query = parts.length > 0 ? `?${parts.join("&")}` : "";

        return this.xrm.WebApi.retrieveRecord(this.entityLogicalName, id, query)
            .then(record => record as unknown as T);
    }

    retrieveMultiple(query?: string): Xrm.Async.PromiseLike<T[]> {
        return this.xrm.WebApi.retrieveMultipleRecords(this.entityLogicalName, query)
            .then(response => response.entities as unknown as T[]);
    }

    create(entity: T): Xrm.Async.PromiseLike<string> {
        return this.xrm.WebApi.createRecord(this.entityLogicalName, entity as unknown as Xrm.WebApi["createRecord"] extends (a: string, b: infer D) => unknown ? D : never)
            .then(response => response.id);
    }

    update(id: string, entity: Partial<T>): Xrm.Async.PromiseLike<void> {
        return this.xrm.WebApi.updateRecord(this.entityLogicalName, id, entity as unknown as Parameters<Xrm.WebApi["updateRecord"]>[2])
            .then(() => undefined);
    }

    delete(id: string): Xrm.Async.PromiseLike<string> {
        return this.xrm.WebApi.deleteRecord(this.entityLogicalName, id)
            .then(() => id);
    }
}

