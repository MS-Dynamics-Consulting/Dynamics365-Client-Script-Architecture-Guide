import { Repository } from "../../shared/repositories/repository";
import { CaseEntity } from "./case.entity";

export class CaseRepository extends Repository<CaseEntity> {
    constructor() {
        super(CaseEntity);
    }
}