import { Router, Request, Response, NextFunction } from 'express';
import { Customer, CustomerModel } from '../models/Customer';
import { Queue, QueueModel } from '../models/Queue';
import { Slot, SlotModel } from '../models/Slot';
import { SlotState } from '../models/SlotState';
import { SocketService } from '../services/socketService';

export class SlotRouter {
    public router: Router;
    public directRouter: Router;
    private socketService = SocketService.Instance;
    constructor() {
        this.router = Router();
        this.directRouter = Router();
        this.routes();
        this.directRoutes();
    }
    // enqueue
    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            const queue: Queue = await QueueModel.findById(req.params.queue_id);
            let customer: Customer;
            if (req.body.customerId) {
                customer = await CustomerModel.findById(req.body.customerId);
            } else if (req.body.mobileNumber) {
                customer = await CustomerModel.findOne({mobileNumber: req.body.mobileNumber});
                // Walk-in customer
                if (customer == null) {
                    let customerName = '';
                    if (req.body.name) {
                        customerName = req.body.name;
                    }
                    customer = await CustomerModel.create({
                        name: customerName, 
                        mobileNumber: req.body.mobileNumber
                    });
                    customer.isWalkIn = true;
                    customer.isPrivateProfile = false;
                }
            }
            
            if (!queue) {
                throw new Error('No such queue');
            }
            if (!customer) {
                throw new Error('No such customer');
            }
            if (!queue.isQAT) {
                throw new Error('queue not accepting appointments');
            }
            if (queue.isComplete) {
                throw new Error('Queue has been ended!');
            }
            if (customer.isInQueue) {
                throw new Error('customer already in queue!');
            }

            let slot: Slot = new SlotModel();
            
            // ----- populate slot properties ----- //
            
            // set slot number
            slot.slotNo = queue.rear + 1;
            slot.customerNo = queue.rear + 1;

            // slot.state = waiting (default value)

            // set customer (POST req.body)
            customer.isInQueue = true;
            customer.save();
            slot.customer = customer;

            if (queue.isQST && queue.isEmpty()) {
                slot.state = SlotState.active;
            }
            queue.rear = slot.slotNo;

            if (queue.isFull()) {
                queue.isQAT = false;
            }

            // save queue changes rear and front
            queue.save();
            slot.queue = queue;

            // save populated slot object
            slot.save();
            console.log(`emitting slot# ${slot.customerNo} to room: queue-${queue._id}`)
            SocketService.Instance.facilityNsp
                .to(`queue-${queue._id}`).emit('slot added', slot);
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let slot = await SlotModel.findById(req.params.id).populate('customer');
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
        
    }

    public async getAllSlots(req: Request, res: Response, next: NextFunction) {
        try {
            const limit = parseInt(<string> req.query.limit) || 10;
            const skip = parseInt(<string> req.query.skip) || 0;
            const queue = await QueueModel.findById(req.params.queue_id);
            if (queue === null) {
                throw new Error('No such queue!');
            }
            let slots = await SlotModel.find({"queue": queue._id})
                        .populate('customer')
                        .limit(limit).skip(skip).sort({slotNo: 'asc'});
            res.json(slots);
        } catch (e: any) {
            next(e);
        }
    }

    /*
    Note:
    identifyCustomer() function identify customer from facility app, 
    we can add identification from customer app, 
    each customer have to scan a code on reaching clinic, 
    this will be a unique code store in queue model, 
    on server side we can match the code and also check if slot is active (on Queue front).
    but due to this model facility have to print the code or 
    write the code on paper each and every time he start the queue
    */

    public async identifyCustomer(req: Request, res: Response, next: NextFunction) {
        try {
            const slot = await SlotModel.findById(req.params.id)
                            .populate("queue")
                            .populate("customer");
            if (slot.state !== SlotState.active) {
                throw new Error('slot is not active');
            }
            if (slot.queue.isComplete) {
                throw new Error('Queue has been ended');
            }
            let identified: boolean = false;
            // TODO: get encrypted mobileNumber
            identified = slot.customer.mobileNumber === req.params.custNo;
            if (identified) {
                slot.state = SlotState.identified;
                slot.startTime = new Date();
                slot.save();
            }
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
    }

    public async dequeue(req: Request, res: Response, next: NextFunction) {
        try {
            const slot = await SlotModel.findById(req.params.id).populate('customer');
            if (!slot) {
                throw new Error('No such slot!');
            }
            const queue = await QueueModel.findById(slot.queue);
            if (queue.isEmpty()) {
                throw new Error('Queue is empty');
            }
            if (queue.isComplete) {
                throw new Error('Queue has been ended');
            }
            if (slot.state !== SlotState.identified) {
                throw new Error('slot is not identified');
            }
            slot.state = SlotState.complete;
            slot.endTime = new Date();

            queue.front = queue.front + 1;
            const peekSlot: Slot = await queue.activateNextSlot();
            
            if (peekSlot === null && queue.front > queue.custCount) {
                queue.endQueue();
            }

            slot.customer.isInQueue = false;

            slot.customer.save();
            queue.save();
            slot.save();
            res.json(slot);
        } catch(e: any) {
            next(e);
        }
    }

    public async swap(req: Request, res: Response, next: NextFunction) {
        try {
            const peekSlot = await SlotRouter.swapSlots(req.params.id);
            res.json(peekSlot);
        } catch(e: any) {
            next(e);
        }
    }

    public async swapNext(req: Request, res: Response, next: NextFunction) {
        try {
            const peekSlot = await SlotModel.findById(req.params.id)
                                .populate('customer')
                                .populate('queue');
            if (peekSlot.state != SlotState.active) {
                throw new Error('Provided slot is not the peek slot');
            }
            const nextSlots = await SlotModel.find(
                        {"queue": peekSlot.queue._id, "slotNo": peekSlot.slotNo + 1});
            const nextSlot = nextSlots[0];
            if (!nextSlot) {
                throw new Error('No next slot in the queue');
            }
            
            const newPeekSlot = await SlotRouter.swapSlots(nextSlot._id, peekSlot);
            res.json(newPeekSlot);
                                
        } catch(e) {
            next(e);
        }
    }

    private static async swapSlots(slotId: any, peekSlot?: Slot): Promise<Slot> {
        const slot = await SlotModel.findById(slotId)
                        .populate('customer')
                        .populate('queue');
            // does slot exists?
            if (!slot) {
                throw new Error('No such slot!');
            }
            // is queue serving? and queue not completed?
            if (!slot.queue.isQST) {
                throw new Error('Queue is not serving!');
            }
            if (!peekSlot) {
                peekSlot = await slot.queue.peek();
            }
            // does this queue has a peek slot?
            if (!peekSlot) {
                throw new Error('Queue does not have a peek slot');
            }
            // this slot state must be waiting
            // peek slot state must be active
            if (peekSlot.state != SlotState.active || 
                slot.state != SlotState.waiting) {
                    throw new Error('incorrect slot state for swaping');
            }
            // swap customerNo
            const customerNo = slot.customerNo;
            const peekCustomerNo = peekSlot.customerNo;
            slot.customerNo = -1;
            await slot.save();
            slot.customerNo = peekCustomerNo;
            peekSlot.customerNo = customerNo;
            // swap customer
            const customer = slot.customer;
            slot.customer = peekSlot.customer;
            peekSlot.customer = customer;
            // save interchanged values
            await peekSlot.save();
            await slot.save();
            // return peek slot which have been swaped
            // with provided slot
            return peekSlot;
    }


    /* ---------------------------------Dev only functions---------------------------------------- */
    /* Helper function to delete slots created in devlopment. 
       Not to be used in actual app. */
    public async deleteQueueSlots(req: Request, res: Response, next: NextFunction) {
        try {
            const queue: Queue = await QueueModel.findById(req.params.queue_id);
            const slots: Slot[] = await SlotModel.find({"queue": queue._id});
            const delQueue = req.query.del_queue;
            const slotIds = slots.map(slot => {
                return slot._id;
            });
            const custIds = slots.map(slot => {
                if (slot.customer) {
                    return slot.customer._id;
                }
            });
            custIds.filter(custId => !!custId);
            console.log('slots', slotIds);
            console.log('custs', custIds);
            SlotModel.deleteMany({_id: slotIds}, {}, 
                err => {if (err) console.error(err);});
            CustomerModel.deleteMany({_id: custIds}, {}, 
                err => {if (err) console.error(err);});
            if (delQueue) {
                console.log('deleting queue:', queue._id);
                const response = await QueueModel.findByIdAndDelete(queue._id);
                console.log('delete resp:', response);
            } else {
                queue.rear = 0;
                queue.front = 0;
                queue.save();
            }
            res.json({status: "deleted"});
        } catch(e: any) {
            next(e);
        }
    }
    public async activatePeek(req: Request, res: Response, next: NextFunction) {
        try {
            const queue = await QueueModel.findById(req.params.queue_id);
            const slot: Slot = await queue.activateNextSlot();
            res.json(slot);
        } catch (e: any) {
            next(e);
        }
    }
    /* ---------------------------------Dev only functions end------------------------------------- */

    public routes() {
        const mainRoute = '/:queue_id/slot';
        this.router.get(mainRoute, this.getAllSlots);
        this.router.post(mainRoute + '/', this.createOne);
        // development only end points
        this.router.get(mainRoute + '/delSlots', this.deleteQueueSlots);
        this.router.get(mainRoute + '/activatePeek', this.activatePeek);
        
    }
    // do not require queue id
    public directRoutes() {
        this.directRouter.get("/:id", this.getOne);
        this.directRouter.get("/:id/custNo/:custNo", this.identifyCustomer);
        this.directRouter.get("/:id/dequeue", this.dequeue);
        this.directRouter.get("/:id/swap", this.swap);
        this.directRouter.get("/:id/swapNext", this.swapNext);
    }

}

const slotRouter = new SlotRouter();


export const slotQueueRouter = slotRouter.router;
export const slotDirectRouter = slotRouter.directRouter;