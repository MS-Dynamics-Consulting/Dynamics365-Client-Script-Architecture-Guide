import { Entity } from "../../shared/entities/base/entity";

export class CaseEntity extends Entity {
    static LogicalName = "incident";
    static EntitySetName = "incidents";

    static Fields = {
        CaseId: "incidentid",
        Title: "title",
        CaseNumber: "ticketnumber",
        StateCode: "statecode",
        StatusCode: "statuscode",
        Customer: "customerid",
        Subject: "subjectid",
        CaseType: "casetypecode",
        Origin: "caseorigincode",
        Priority: "prioritycode",
        Owner: "ownerid",
        Description: "description"
    } as const;

    static StateCode = {
        Active: 0,
        Inactive: 1
    } as const;

    static StatusCode = {
        Active: 1,
        InProgress: 100000001,
        PendingReview: 100000002,
        Resolved: 2,
        Cancelled: 100000003
    } as const;

    static FormIds = {
        Main: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        QuickCreate: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
    } as const;

    // Typed attributes — match the field values returned by Xrm.WebApi
    title?: string;
    ticketnumber?: string;
    statecode?: CaseStateCode;
    statuscode?: CaseStatusCode;
    customerid?: string;
    subjectid?: string;
    casetypecode?: number;
    caseorigincode?: number;
    prioritycode?: number;
    ownerid?: string;
    description?: string;
}

export type CaseStatusCode = typeof CaseEntity.StatusCode[keyof typeof CaseEntity.StatusCode];
export type CaseStateCode = typeof CaseEntity.StateCode[keyof typeof CaseEntity.StateCode];
export type CaseFields = typeof CaseEntity.Fields[keyof typeof CaseEntity.Fields];
