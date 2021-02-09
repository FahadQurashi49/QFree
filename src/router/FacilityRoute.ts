import { Router, Request, Response, NextFunction } from 'express';
import Facility from '../models/Facility';

export class FacilityRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            let facility = await Facility.create(req.body);
            res.json(facility);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let facility = await Facility.findById(req.params.id);
            res.json(facility);
        } catch (e: any) {
            next(e);
        }
        
    }

    public routes() {
        this.router.post("/", this.createOne);
        this.router.get("/:id", this.getOne);
    }

}

const facilityRouter = new FacilityRouter();
facilityRouter.routes();

export default facilityRouter.router;