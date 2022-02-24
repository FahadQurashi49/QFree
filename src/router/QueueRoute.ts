import { Router, Request, Response, NextFunction } from 'express';
import { scheduleJob } from 'node-schedule';
import { Queue, QueueModel } from '../models/Queue';
import Facility from '../models/Facility';
import Utility from '../shared/utils'
import { Slot, SlotModel } from '../models/Slot';
import { SlotState } from '../models/SlotState';
export class QueueRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            const queueObj: Queue = req.body;
            const facility = await Facility.findById(req.params.fac_id);
            if (facility) {
                queueObj.facility = facility;
            } else {
                throw new Error('Queue can not exits without facility');
            }
            const queue: Queue = await QueueModel.create(queueObj);
            scheduleJob('QAT', queue.activationTimeStart, async () => {
                console.log('running QAT job');
                const currQueue = await QueueModel.findById(queue._id);
                if (!currQueue.isComplete) {
                    currQueue.isQAT = true;
                    currQueue.save();
                } else {
                    console.log('Queue has been ended!');
                }
                
            });
             scheduleJob('QST', queue.servingTimeStart, async () =>  {
                console.log('running QST job');
                const currQueue = await QueueModel.findById(queue._id);
                if (!currQueue.isComplete) {
                    currQueue.isQST = true;
                    currQueue.front = currQueue.front + 1;
                    await currQueue.activateNextSlot();
                    currQueue.save();
                } else {
                    console.log('Queue has been ended!');
                }
                
            });
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
                const showCompleted = parseInt(<string> req.query.completed) === 1;
                const showLive = parseInt(<string> req.query.live) === 1;
                /* console.log(limit);
                console.log(page);
                console.log(req.params.fac_id);
                let facility = await Facility.findById(req.params.fac_id); */
                const filterParams = {
                    facility: req.params.fac_id, 
                    isComplete: showCompleted,
                    isQST: showLive
                };
                let queues = await QueueModel.find(filterParams)
                    .limit(limit).skip(page * limit).sort({servingTimeStart: 'desc'});
                res.json(queues);
        } catch (e: any) {
            next(e);
        }
    }
    public async endQueue(req: Request, res: Response, next: NextFunction) {
        try {
            let queue : Queue = await QueueModel.findById(req.params.id);
            if (!queue) {
                throw new Error('No such queue');
            }
            if (queue.isComplete) {
                res.json(queue);
            }
            const slots: Slot[] = await SlotModel.find({queue: queue._id, 
                state: {$ne: SlotState.complete}})
                .populate('customer');

            slots.forEach((slot: Slot) => {
                /* if (slot.state !== SlotState.waiting) {
                    slot.state = SlotState.waiting;
                } */
                slot.customer.isInQueue = false;
                slot.customer.save();
            })

            queue.endQueue();
            queue.front = 0;
            queue.save();
            res.json(queue);
        } catch (e: any) {
            next(e);
        }
    }
    

    public routes() {
        const mainRoute = '/:fac_id/queue';
        this.router.post(mainRoute, this.createOne);
        this.router.get(mainRoute, this.getAllQueues);
        this.router.get(mainRoute + "/:id", this.getOne);
        this.router.get(mainRoute + "/:id/end", this.endQueue);
    }

}

const queueRouter = new QueueRouter();
queueRouter.routes();

export default queueRouter.router;