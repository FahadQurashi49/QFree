import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { connect, Mongoose } from 'mongoose';

import facilityRouter from './router/FacilityRoute';
import queueRouter from './router/QueueRoute';
import customerRouter from './router/CustomerRoute';
import slotRouter from './router/SlotRoute';

// Creates and configures an ExpressJS web server.
class Server {

  // ref to Express instance
  public express: express.Application;
  private ERROR_CODE: number = 500;
  private static MONGO_URI:string = 'mongodb+srv://fahad:qfree9211@qfree.20yyz.mongodb.net/qfree?retryWrites=true&w=majority';

  //Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.config();
    this.routes();
  }

  public connectDB(): Promise<Mongoose> {
      return connect(Server.MONGO_URI || process.env.mongodb_uri, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  // application config
  private config(): void {
    // express middleware
    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  // Configure API endpoints.
  private routes(): void {
    this.express.use('/api/v1/facility', facilityRouter);
    this.express.use('/api/v1/facility', queueRouter);
    this.express.use('/api/v1/facility', slotRouter);
    this.express.use('/api/v1/customer', customerRouter);
    
    this.express.use((err, req, res, next) => {
      let error = {
        error: err.message,
        errorCode: err.errorCode || this.ERROR_CODE,
        statusCode: err.statusCode || this.ERROR_CODE,
      };
      console.log(error);
      res.status(error.statusCode).json(error);
    });
  }

}

export default new Server();