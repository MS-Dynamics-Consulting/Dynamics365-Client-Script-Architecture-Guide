import { Repository } from "../../shared/repositories/repository";
import { CaseEntity, CaseFields } from "./case.entity";

export class CaseRepository extends Repository<CaseEntity, CaseFields> {
    constructor() {
        super(CaseEntity);
    }
}