import { Router, Request, Response, NextFunction } from 'express';
import { Customer, CustomerModel } from '../models/Customer';
import { Queue, QueueModel } from '../models/Queue';
import { Slot, SlotModel } from '../models/Slot';

import { v4 as uuidv4 } from 'uuid';

export class SlotRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
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
            if (queue.facility !== req.params.fac_id) {
                throw new Error('facility does not have this queue');
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

            // slot number 0 means queue is empty
            if (slot.slotNo === 0) {
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
                if (queue.facility !== req.params.fac_id) {
                    throw new Error('facility does not have this queue');
                }
                let slots = await SlotModel.find({"queue": queue._id}).populate('customer')
                    .limit(limit).skip(page * limit).sort({slotNo: 'asc'});
                res.json(slots);
        } catch (e: any) {
            next(e);
        }
    }

    public routes() {
        const mainRoute = '/:fac_id/queue/:queue_id/slot';
        this.router.get(mainRoute, this.getAllSlots);
        this.router.post(mainRoute + "/", this.createOne);
        this.router.get(mainRoute + "/:id", this.getOne);
    }

}

const slotRouter = new SlotRouter();
slotRouter.routes();

export default slotRouter.router;