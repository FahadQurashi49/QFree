import { Schema, model, Document } from 'mongoose';

import { Slot, SlotModel } from '../models/Slot';
import Utility from '../shared/utils'
import { SlotState } from './SlotState';


export interface Queue extends Document {
    name: string;
    operatorName: string;
    activationTimeStart: Date;
    activationTimeEnd: Date;
    servingTimeStart: Date;
    servingTimeEnd: Date;
    endTime: Date;
    breakTimeDuration: number;
    timeToServe: number;
    totSlots: number;
    isQAT: boolean;
    isQST: boolean;
    canDequeue: boolean;
    isComplete: boolean;
    front: number;
    rear: number;
    facility: any;
    isFull(): boolean;
    isEmpty(): boolean;
    peek(): Promise<Slot>;
    activateNextSlot(): Promise<Slot>;
    endQueue(): Promise<void>;
};

let QueueSchema = new Schema<Queue>({
    name: {
        type: String,
        minlength: [3, 'Name must be of atleast 3 characters'],
        maxlength: [30, 'Name must be of atmost 30 characters'],
        required: [true, 'Name of queue is required']
    },
    operatorName: {
        type: String,
        minlength: [3, 'Name must be of atleast 3 characters'],
        maxlength: [30, 'Name must be of atmost 30 characters'],
        required: [true, 'operator name of queue is required']
    },
    activationTimeStart: {
        type: Date,
        required: [true, 'activation time start, of queue is required']
    },
    activationTimeEnd: {
        type: Date
    },
    servingTimeStart: {
        type: Date,
        required: [true, 'serving time start, of queue is required']
    },
    servingTimeEnd: {
        type: Date,
        required: [true, 'serving time end, of queue is required']
    },
    endTime: {
        type: Date
    },
    breakTimeDuration: {
        // after each slot, in minutes
        type: Number,
        min: [2, 'break time should be more than 2 minutes'],
        max: [10, 'break time should be less than 10 minutes']
    },
    timeToServe: {
        type: Number,
        min: [5, 'time to serve should be more than 5 minutes'],
        required: [true, 'time to serve is required']
    },
    totSlots: {
        type: Number,
    },
    isQAT: {
        type: Boolean,
        default: false
    },
    isQST: {
        type: Boolean,
        default: false
    },
    canDequeue: {
        type: Boolean,
        default: false
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    front: {
        type: Number,
        default: 0
    },
    rear: {
        type: Number,
        default: 0
    },
    facility: {
        type: String,
        ref: 'facility',
        required: [true, 'queue can not exist without facility']
    }
});

QueueSchema.methods.isFull = function () {
    return (this.rear === this.totSlots);
};

QueueSchema.methods.isEmpty = function () {
    return (this.front === 0 || this.front > this.rear);
};

QueueSchema.methods.peek = async function (): Promise<Slot> {
    const queuePeek = 
        await SlotModel.find({"queue": this._id, "slotNo": this.front});
    return queuePeek[0];
};

QueueSchema.methods.endQueue = async function (): Promise<void> {
    this.isComplete = true;
    this.isQAT = false;
    this.isQST = false;
    this.endTime = new Date();
}

QueueSchema.methods.activateNextSlot = async function (): Promise<Slot> {
    if (!this.isEmpty()) {
        console.log('getting peek slot');
        const peekSlot =  await this.peek();
        console.log('peek slot', peekSlot);
        if (peekSlot) {
            peekSlot.state = SlotState.active;
            peekSlot.save();
            console.log('saving peek slot', peekSlot);
            return peekSlot;
        }
    } else {
        console.log('Queue is empty!');
        return null;
    }
};

QueueSchema.pre('save', async function () {
    // check login
    if (!this.isNew) {
        return;
    }
    let queue: Queue = this;
    console.log('running pre save hook:', queue.name);
    queue.activationTimeStart = new Date(queue.activationTimeStart);
    queue.servingTimeStart = new Date(queue.servingTimeStart);
    queue.servingTimeEnd = new Date(queue.servingTimeEnd);

    /* ------------------- check queue serving time ------------------- */
    // qst start time
    let now = new Date();
    let qstStLb =  Utility.addSubHours(new Date(), 1);// queue serving time Start time Lower bound

    let qstStUb = new Date(); // queue serving time Start time Upper bound
    qstStUb.setDate(qstStUb.getDate() + 5);

    if (queue.servingTimeStart < qstStLb) {
        throw new Error('QST must be after 1 hours from now')
    }
    if (queue.servingTimeStart > qstStUb) {
        throw new Error('QST must be before 5 days from now')
    }
    // qst end time
    let qstEtLb = Utility.addSubHours(queue.servingTimeStart, 1);
    let qstEtUb = Utility.addSubHours(queue.servingTimeStart, 8);

    if (queue.servingTimeEnd < qstEtLb) {
        throw new Error('QST must be of atleast 1 hour')
    }
    if (queue.servingTimeEnd > qstEtUb) {
        throw new Error('QST cannot be more than 8 hours long')
    }

    /* ------------------- check queue activation time ------------------- */
    // qat start time
    // lower bound
    if (queue.activationTimeStart < now) {
        throw new Error('QAT start time must not be past')
    }// queue activation time, Start time Upper bound
    let qatStUb = Utility.addSubHours(queue.servingTimeStart, 1, true);
   if (queue.activationTimeStart > qatStUb) {
        throw new Error('QAT must be atleast 1 hour before QST')
    }
    // qat end time
    if (queue.activationTimeEnd) {
        let qatEtLb = Utility.addSubHours(queue.activationTimeStart, 1);// queue activation time, Start time Upper bound
        if (queue.activationTimeEnd < qatEtLb) {
            throw new Error('QAT must be of atleast 1 hour');
        }
        // upper bound
        if (queue.activationTimeEnd > queue.servingTimeEnd) {
            throw new Error('QAT must not exceed QST');
        }
    } else {
        queue.activationTimeEnd = queue.servingTimeEnd;
    }
    /* ------------------- check time to serve ------------------- */
    if (queue.totSlots < 1) {
        throw new Error('Time to serve with break time duration, is more than serving time duration');
    }
});

export const QueueModel = model<Queue>('queue', QueueSchema);