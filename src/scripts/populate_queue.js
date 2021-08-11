const http = require('http');


let i = 1;
let count = 6;
let customers = [];
let slots = [];
const qId = '';

createCustomers();

function createCustomers() {
    console.log('running');
    let callback = function () {
        if (i < count) {
            i = i + 1;
            createCustomer(i, callback);
        } else {
            i = 1;
            console.log(customers);
            createSlots();
        }
    };
    createCustomer(i, callback);
}

function createCustomer(index, cb) {
    console.log('index', index);
    const rnd = Math.floor(Math.random() * 1000);
    let postData = JSON.stringify({
        "name": `demo patient${rnd} ${index}`,
        "email": `demo${rnd}@abc${index}.com`,
        "mobileNumber": `03138765${rnd}${index}`,
        "password": `abcdefg${rnd}${index}`
    });
    const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/customer',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
        let body = '';
        res.on('data', d => {
          body += d;
        });
        res.on('end', () => {
            customers.push(JSON.parse(body));
            setTimeout(() => {
                cb();
            },1000);
        });
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
      
    // Write data to request body
    req.write(postData);
    req.end();
}

function createSlots() {
    console.log('running');
    let callback = function () {
        if (i < count) {
            i = i + 1;
            createSlot(customers[i-1]._id, callback);
        } else {
            console.log(slots);
        }
    };
    createSlot(customers[i-1]._id, callback);
}
function createSlot(custId, cb) {
    console.log('custId:', custId);
    let postData = JSON.stringify({
        "customerId": custId
    });
    const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/v1/queue/${qId}/slot`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    const req = http.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)
        let body = '';
        res.on('data', d => {
          body += d;
        });
        res.on('end', () => {
            slots.push(JSON.parse(body));
            setTimeout(() => {
                cb();
            },1000);
        });
    });
    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });
      
    // Write data to request body
    req.write(postData);
    req.end();
}

  