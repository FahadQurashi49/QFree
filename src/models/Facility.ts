import {Schema, model} from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

// TODO: add validation for email, mobile, address
let FacilitySchema: Schema = new Schema({
    _id: {
        type: String,
    },
    facilityName: {
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
    address: {
        type: String,
        required: [true, 'address feild is required']
    },
    password: {
        type: String,
        minlength: [6, 'password must be of atleast 6 characters'],
        maxlength: [30, 'password must be of atmost 30 characters'],
        required: [true, 'password feild is required']
    },
});
FacilitySchema.plugin(uniqueValidator);
export default model('facility', FacilitySchema);