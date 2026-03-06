import { Entity } from "../entities/base/entity";
import { getXrmContext } from "../utils/xrm-context.util";

export interface IRepository<T extends Entity, TFields extends string = string> {
    retrieve(id: string, select?: TFields[], expand?: string[]): Xrm.Async.PromiseLike<T>;
    retrieveMultiple(query?: string): Xrm.Async.PromiseLike<T[]>;
    create(entity: T): Xrm.Async.PromiseLike<string>;
    update(id: string, entity: Partial<T>): Xrm.Async.PromiseLike<void>;
    delete(id: string): Xrm.Async.PromiseLike<string>;
    associate(sourceId: string, navigationProperty: string, targetEntitySetName: string, targetId: string): Promise<void>;
    disassociate(sourceId: string, navigationProperty: string, targetId: string): Promise<void>;
}

type EntityConstructor<T extends Entity> = {
    new (...args: any[]): T;
    LogicalName: string;
    EntitySetName: string;
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
export abstract class Repository<T extends Entity, TFields extends string = string> implements IRepository<T, TFields> {
    private readonly entityLogicalName: string;
    private readonly entitySetName: string;
    private readonly xrm: typeof Xrm;

    constructor(entityType: EntityConstructor<T>) {
        this.entityLogicalName = entityType.LogicalName;
        this.entitySetName = entityType.EntitySetName;
        this.xrm = getXrmContext();
    }

    retrieve(id: string, select?: TFields[], expand?: string[]): Xrm.Async.PromiseLike<T> {
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

    async associate(sourceId: string, navigationProperty: string, targetEntitySetName: string, targetId: string): Promise<void> {
        const apiBase = `${this.xrm.Utility.getGlobalContext().getClientUrl()}/api/data/v9.2`;
        const response = await fetch(`${apiBase}/${this.entitySetName}(${sourceId})/${navigationProperty}/$ref`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0"
            },
            body: JSON.stringify({ "@odata.id": `${apiBase}/${targetEntitySetName}(${targetId})` })
        });
        if (!response.ok) throw new Error(`Associate failed: ${response.statusText}`);
    }

    async disassociate(sourceId: string, navigationProperty: string, targetId: string): Promise<void> {
        const apiBase = `${this.xrm.Utility.getGlobalContext().getClientUrl()}/api/data/v9.2`;
        const response = await fetch(`${apiBase}/${this.entitySetName}(${sourceId})/${navigationProperty}(${targetId})/$ref`, {
            method: "DELETE",
            headers: {
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0"
            }
        });
        if (!response.ok) throw new Error(`Disassociate failed: ${response.statusText}`);
    }
}

