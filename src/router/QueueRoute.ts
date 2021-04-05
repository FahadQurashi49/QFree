import { Router, Request, Response, NextFunction } from 'express';
import Queue from '../models/Queue';
import Facility from '../models/Facility';

export class QueueRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            let queueObj = req.body;
            if (queueObj && queueObj.facilityId) {
                let facility = await Facility.findById(queueObj.facilityId);
                queueObj.facility = facility;
            } else {
                throw new Error('Queue can not exits without facility');
            }
            let queue = await Queue.create(queueObj);
            res.json(queue);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let queue : any = await Queue.findById(req.params.id).populate('facility');
            res.json(queue);
        } catch (e: any) {
            next(e);
        }
        
    }

    public routes() {
        this.router.post("/", this.createOne);
        this.router.get("/:id", this.getOne);
    }

}

const queueRouter = new QueueRouter();
queueRouter.routes();

export default queueRouter.router;