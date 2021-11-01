import { Schema, model, Document } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

export interface Customer extends Document {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
    isInQueue: boolean;
    isWalkIn: boolean;
    isPrivateProfile: boolean;
}

let CustomerSchema = new Schema<Customer>({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: false
    },
    mobileNumber: {
        type: String,
        index: { unique: true },
        required: [true, 'mobile number feild is required']
    },
    password: {
        type: String,
        required: false
    },
    isInQueue: {
        type: Boolean,
        default: false
    },
    isWalkIn: {
        type: Boolean,
        default: false
    },
    isPrivateProfile: {
        type: Boolean,
        default: true
    }
});

CustomerSchema.plugin(uniqueValidator);
export const CustomerModel = model<Customer>('customer', CustomerSchema);