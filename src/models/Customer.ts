import { Schema, model, Document } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

export interface Customer extends Document {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
    isInQueue: boolean;
}

let CustomerSchema = new Schema<Customer>({
    name: {
        type: String,
        minlength: [3, 'Name must be of atleast 3 characters'],
        maxlength: [30, 'Name must be of atmost 30 characters'],
        required: [true, 'Name feild is required']
    },
    email: {
        type: String,
        index: { unique: true },
        required: [true, 'email feild is required']
    },
    mobileNumber: {
        type: String,
        index: { unique: true },
        required: [true, 'mobile number feild is required']
    },
    password: {
        type: String,
        minlength: [6, 'password must be of atleast 6 characters'],
        maxlength: [30, 'password must be of atmost 30 characters'],
        required: [true, 'password feild is required']
    },
    isInQueue: {
        type: Boolean,
        default: false
    }
});

CustomerSchema.plugin(uniqueValidator);
export const CustomerModel = model<Customer>('customer', CustomerSchema);