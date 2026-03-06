import { Entity } from "../../shared/entities/base/entity";

export class CaseEntity extends Entity {
    static LogicalName = "incident";
    static EntitySetName = "incidents";

    static Fields = {
        // Primary fields
        CaseId: "incidentid",
        Title: "title",
        CaseNumber: "ticketnumber",

        // Status fields
        StateCode: "statecode",
        StatusCode: "statuscode",

        // Customer field
        Customer: "customerid",

        // Categorization fields
        Subject: "subjectid",
        CaseType: "casetypecode",
        Origin: "caseorigincode",
        Priority: "prioritycode",

        // Assignment
        Owner: "ownerid",

        // Details
        Description: "description",

        // Audit fields
        CreatedOn: "createdon",
        ModifiedOn: "modifiedon"
    } as const;

    static StateCode = {
        Active: 0,
        Inactive: 1
    } as const;

    static StatusCode = {
        // Active statuses
        Active: 1,
        Draft: 100000000,
        InProgress: 100000001,
        PendingReview: 100000002,

        // Closed statuses
        Resolved: 2,
        Cancelled: 100000003
    } as const;

    static FormIds = {
        Main: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        QuickCreate: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    } as const;

    constructor(id?: string) {
        super(id);
    }
}

export type CaseStatusCode = typeof CaseEntity.StatusCode[keyof typeof CaseEntity.StatusCode];
export type CaseStateCode = typeof CaseEntity.StateCode[keyof typeof CaseEntity.StateCode];
export type CaseFields = typeof CaseEntity.Fields[keyof typeof CaseEntity.Fields];
