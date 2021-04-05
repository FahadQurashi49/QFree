import { Schema, model } from 'mongoose';

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
    front: {
        type: Schema.Types.ObjectId,
        ref: 'slot'
    },
    rear: {
        type: Schema.Types.ObjectId,
        ref: 'slot'
    },
    facility: {
        type: Schema.Types.ObjectId,
        ref: 'facility',
        required: [true, 'queue can not exist without facility']
    },
});

QueueSchema.pre('save', async function () {
    // check login
    let queue: any = this;
    console.log('running pre save hook:', queue.name);
    queue.activationTimeStart = new Date(queue.activationTimeStart);
    queue.servingTimeStart = new Date(queue.servingTimeStart);
    queue.servingTimeEnd = new Date(queue.servingTimeEnd);

    /* ------------------- check queue serving time ------------------- */
    // qst start time
    let now = new Date();
    let qstStLb = new Date(); // queue serving time Start time Lower bound
    qstStLb.setHours((qstStLb.getHours() + 2) % 24);
    qstStLb.setMinutes((qstStLb.getMinutes() + 30) % 60);

    let qstStUb = new Date(); // queue serving time Start time Upper bound
    qstStUb.setDate(qstStUb.getDate() + 5);

    if (queue.servingTimeStart < qstStLb) {
        throw new Error('QST must be after 2.5 hours from now')
    }
    if (queue.servingTimeStart > qstStUb) {
        throw new Error('QST must be before 5 days from now')
    }
    // qst end time
    let qstEtLb = new Date(queue.servingTimeStart);
    qstEtLb.setHours((queue.servingTimeStart.getHours() + 1) % 24);

    let qstEtUb = new Date(queue.servingTimeStart);
    qstEtUb.setHours((queue.servingTimeStart.getHours() + 8) % 24);

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
    }
    let qatStUb = new Date(queue.servingTimeStart); // queue activation time, Start time Upper bound
    qatStUb.setHours((queue.servingTimeStart.getHours() - 1) % 24);
    if (queue.activationTimeStart > qatStUb) {
        throw new Error('QAT must be atleast 1 hour before QST')
    }
    // qat end time
    if (queue.activationTimeEnd) {
        let qatEtLb = new Date(queue.activationTimeStart); // queue activation time, Start time Upper bound
        qatEtLb.setHours((queue.activationTimeStart.getHours() + 1) % 24);
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
    // queue serving time duration in minutes
    let qst_tp = ((queue.servingTimeEnd - queue.servingTimeStart)/1000)/60;
    let totSlots = Math.floor(qst_tp/(queue.timeToServe + (queue.breakTimeDuration? queue.breakTimeDuration: 0)));
    console.log('totSlots:', totSlots);
    if (totSlots < 1) {
        throw new Error('Time to serve with break time duration, is more than serving time duration');
    }
});

/* export class IQueue extends Document {
    name: String;
    operator: String;
    activationTimeStart: Date;
    activationTimeEnd: Date;
    servingTimeStart: Date;
    servingTimeEnd: Date;
    breakTimeDuration: Number;
    isQAT: Boolean;
    isQST: Boolean;
    canDequeue: Boolean;
    front: any;
    rear: any;
    facility: any;
    public static checkQueue() {}
}; */

export default model('queue', QueueSchema);