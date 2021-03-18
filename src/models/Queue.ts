import {Schema, model} from 'mongoose';

let QueueSchema: Schema = new Schema({
    name: {
        type: String,
        minlength: [3, 'Name must be of atleast 3 characters'],
        maxlength: [30, 'Name must be of atmost 30 characters'],
        required: [true, 'Name of queue is required']
    },
    operator: {
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
        type: Date,
        required: [true, 'activation time end, of queue is required']
    },
    servingTimeStart: {
        type: Date,
        required: [true, 'serving time start, of queue is required']
    },
    servingTimeEnd: {
        type: Date,
        required: [true, 'serving time end, of queue is required']
    },
    breakTimeStart: {
        type: Date,
    },
    breakTimeEnd: {
        type: Date,
    },
    breakTimeDuration: {
        // after each slot, in minutes
        type: Number,
        min: [2, 'break time should be more than 2 minutes'],
        max: [30,'break time should be less than 30 minutes']
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
    facility: {
        type: Schema.Types.ObjectId,
        ref: 'facility'
    },
});
export default model('queue', QueueSchema);