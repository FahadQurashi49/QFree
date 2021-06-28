import { Router, Request, Response, NextFunction } from 'express';
import { CustomerModel } from '../models/Customer';

export class CustomerRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    public async createOne(req: Request, res: Response, next: NextFunction) {
        try {
            let customer = await CustomerModel.create(req.body);
            res.json(customer);
        } catch (e: any) {
            next(e);
        }
    }

    public async getOne(req: Request, res: Response, next: NextFunction) {
        try {
            let customer = await CustomerModel.findById(req.params.id);
            res.json(customer);
        } catch (e: any) {
            next(e);
        }
        
    }

    public routes() {
        this.router.post("/", this.createOne);
        this.router.get("/:id", this.getOne);
    }

}

const customerRouter = new CustomerRouter();
customerRouter.routes();

export default customerRouter.router;