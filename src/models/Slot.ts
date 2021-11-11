import { Schema, model, Document } from 'mongoose';
import { SlotState } from './SlotState';
import * as uniqueValidator from 'mongoose-unique-validator';
import { Customer } from './Customer';
import { Queue } from './Queue';

export interface Slot extends Document {
    startTime: Date;
    endTime: Date;
    notificationTimes: [Date];
    slotNo: number;     // internal numbering of slots always in sequence
    customerNo: number; // customer numbering shown on the app
    state: SlotState;
    customer: Customer;
    queue: Queue;
}

let SlotSchema = new Schema<Slot>({
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    notificationTimes: {
        type: [Date],
    },
    slotNo: {        // internal numbering of slots always in sequence
        type: Number,
    },
    customerNo: {    // customer numbering shown on the app
        type: Number,
    },
    state: {
        type: String,
        enum: SlotState,
        default: SlotState.waiting
    },
    queue: {
        type: Schema.Types.ObjectId,
        ref: 'queue',
        required: [true, 'slot can not exist without queue']
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'customer'
    }
    
});

SlotSchema.index({ slotNo: 1, queue: 1}, { unique: true });
SlotSchema.index({ customerNo: 1, queue: 1}, { unique: true });
SlotSchema.plugin(uniqueValidator);

export const SlotModel = model<Slot>('slot', SlotSchema);