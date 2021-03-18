import {Schema, model} from 'mongoose';
import { SlotState } from './SlotState';
import * as uniqueValidator from 'mongoose-unique-validator';

let SlotSchema: Schema = new Schema({
    startTime: {
        type: Date,
        required: [true, 'start time of slot is required']
    },
    endTime: {
        type: Date,
        required: [true, 'end time of slot is required']
    },
    notificationTime: {
        type: Date,
    },
    slotNo: {
        type: Number,
        index: { unique: true }
    },
    customerIdNo: { // customer identification number
        type: Number,
        index: { unique: true }
    },
    cashPaid: {
        type: Boolean,
        default: false
    },
    fees: {
        type: Number,
        required: [true, 'fees of slot is required']
    },
    state: {
        type: String,
        enum: SlotState,
        default: SlotState.inactive
    },
    next: {
        type: Schema.Types.ObjectId,
        ref: 'slot'
    },
    previous: {
        type: Schema.Types.ObjectId,
        ref: 'slot'
    }
});

SlotSchema.plugin(uniqueValidator);
export default model('slot', SlotSchema);