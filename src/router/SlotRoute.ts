import { Router, Request, Response, NextFunction } from 'express';
import { Customer, CustomerModel } from '../models/Customer';
import { Queue, QueueModel } from '../models/Queue';
import { Slot, SlotModel } from '../models/Slot';

import { v4 as uuidv4 } from 'uuid';
import { SlotState } from '../models/SlotState';

export class SlotRouter {
    public router: Router;
    public directRouter: Router;
    constructor() {
        this.router = Router();
        this.directRouter = Router();
        this.routes();
        this.directRoutes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            const queue: Queue = await QueueModel.findById(req.params.queue_id);
            const customer: Customer = await CustomerModel.findById(req.body.customerId);
            if (!queue) {
                throw new Error('No such queue');
            }
            if (!customer) {
                throw new Error('No such customer');
            }
            if (!queue.isQAT) {
                throw new Error('queue not accepting appointments');
            }
            if (queue.isFull()) {
                throw new Error('queue is full!');
            }
            if (customer.isInQueue) {
                throw new Error('customer already in queue!');
            }

            let slot: Slot = new SlotModel();
            
            // ----- populate slot properties ----- //
            
            // set slot number
            slot.slotNo = queue.rear + 1;
            
            // generate unique slotId and customerIdNo
            slot.slotId = uuidv4();
            slot.customerIdNo = uuidv4();

            // slot.state = waiting (default value)

            // set customer (POST req.body)
            customer.isInQueue = true;
            customer.save();
            slot.customer = customer;

            // slot number 1 means queue was empty
            if (slot.slotNo === 1) {
                queue.front = slot.slotNo;
            }
            queue.rear = slot.slotNo;

            // save queue changes rear and front
            queue.save();
            slot.queue = queue;

            // save populated slot object
            slot.save();
            
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let slot = await SlotModel.findById(req.params.id);
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
        
    }

    public async getAllSlots(req: Request, res: Response, next: NextFunction) {
        try {
                const limit = parseInt(<string> req.query.limit) || 10;
                const page = parseInt(<string> req.query.page) || 0;
                /* console.log(limit);
                console.log(page);
                console.log(req.params.fac_id);
                let facility = await Facility.findById(req.params.fac_id); */
                const queue = await QueueModel.findById(req.params.queue_id);
                let slots = await SlotModel.find({"queue": queue._id}).populate('customer')
                    .limit(limit).skip(page * limit).sort({slotNo: 'asc'});
                res.json(slots);
        } catch (e: any) {
            next(e);
        }
    }

    public async activateNextSlot(req: Request, res: Response, next: NextFunction) {
        try {
            const queue = await QueueModel.findById(req.params.queue_id);
            
            if (queue.isEmpty()) {
                throw new Error('Queue is empty');
            }
            if (!queue.canDequeue) {
                throw new Error('can not activate slot right now');
            }

            queue.canDequeue = false;

            const peekSlot =  await queue.peek();
            peekSlot.state = SlotState.active;

            queue.save();
            peekSlot.save();
            res.json(peekSlot);
        } catch (e: any) {
            next(e);
        }
        
    }

    public async identifyCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const slot = await SlotModel.findById(req.params.id);
            if (slot.state !== SlotState.active) {
                throw new Error('slot is not active');
            }
            const identified = slot.customerIdNo === req.params.custNo;
            if (identified) {
                slot.state = SlotState.identified;
                slot.startTime = new Date();
                slot.save();
            }
            res.json({identified: identified});
        } catch (e: any) {
            next(e);
        }
    }

    public async dequeue(req: Request, res: Response, next: NextFunction) {
        try {
            const slot = await SlotModel.findById(req.params.id);
            if (!slot) {
                throw new Error('No such slot!');
            }
            const queue = await QueueModel.findById(slot.queue);
            if (queue.isEmpty()) {
                throw new Error('Queue is empty');
            }
            if (slot.state !== SlotState.identified) {
                throw new Error('slot is not identified');
            }
            slot.state = SlotState.complete;
            slot.endTime = new Date();

            const front = queue.front + 1;
            if (queue.totSlots === front) {
                queue.isComplete = true;
            }

            queue.front = front;
            queue.canDequeue = true;

            queue.save();
            slot.save();
            res.json(queue);
        } catch(e: any) {
            next(e);
        }
    }

    public routes() {
        const mainRoute = '/:queue_id/slot';
        this.router.get(mainRoute, this.getAllSlots);
        this.router.post(mainRoute + "/", this.createOne);
        this.router.get(mainRoute + "/get/next", this.activateNextSlot);
        
    }
    // do not require queue id
    public directRoutes() {
        this.directRouter.get("/:id", this.getOne);
        this.directRouter.get("/:id/custNo/:custNo", this.identifyCustomer);
        this.directRouter.get("/:id/dequeue", this.dequeue);
    }

}

const slotRouter = new SlotRouter();


export const slotQueueRouter = slotRouter.router;
export const slotDirectRouter = slotRouter.directRouter;