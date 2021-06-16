import { Router, Request, Response, NextFunction } from 'express';
import { scheduleJob } from 'node-schedule';
import { Queue, QueueModel } from '../models/Queue';
import Facility from '../models/Facility';
import Utility from '../shared/utils'

export class QueueRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            const queueObj = req.body;
            const facility = await Facility.findById(req.params.fac_id);
            if (facility) {
                queueObj.facility = facility;
            } else {
                throw new Error('Queue can not exits without facility');
            } 
            const queue: Queue = await QueueModel.create(queueObj);
            scheduleJob('QAT', queue.activationTimeStart, () => {
                console.log('running job');
                queue.isQAT = true;
                queue.save();
            });
            if (queue.activationTimeEnd.getTime() !== queue.servingTimeEnd.getTime()) {
                scheduleJob('QAT_end', queue.activationTimeEnd, () => {
                    queue.isQAT = false;
                    queue.save();
                });
            }
            /* scheduleJob('QST', queue.servingTimeStart, () => {
                queue.isQST = true;
                queue.save();
            });
            // end Queue after 2 hours of servingTimeEnd
            const qstEnd = Utility.addSubHours(queue.servingTimeEnd, 2);
            scheduleJob('QST', qstEnd, () => {
                queue.isQST = false;
                queue.isComplete = true;
                // check if is still few slots are left
                // set queue.isInComplete = true;
                queue.save();
            }); */
            res.json(queue);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let queue : any = await QueueModel.findById(req.params.id); //.populate('facility');
            res.json(queue);
        } catch (e: any) {
            next(e);
        }
        
    }

    public async getAllQueues(req: Request, res: Response, next: NextFunction) {
        try {
                const limit = parseInt(<string> req.query.limit) || 10;
                const page = parseInt(<string> req.query.page) || 0;
                /* console.log(limit);
                console.log(page);
                console.log(req.params.fac_id);
                let facility = await Facility.findById(req.params.fac_id); */
                let queues = await QueueModel.find({ "facility": req.params.fac_id })
                    .limit(limit).skip(page * limit).sort({servingTimeStart: 'desc'});
                res.json(queues);
        } catch (e: any) {
            next(e);
        }
    }

    public routes() {
        const mainRoute = '/:fac_id/queue';
        this.router.post(mainRoute, this.createOne);
        this.router.get(mainRoute, this.getAllQueues);
        this.router.get(mainRoute + "/:id", this.getOne);
    }

}

const queueRouter = new QueueRouter();
queueRouter.routes();

export default queueRouter.router;