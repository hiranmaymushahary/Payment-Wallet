import { Request, Response, NextFunction } from "express";
import { IdempotencyUtil } from "../utils/idempotency";


export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {

    const idempotencyKey = req.headers['x-idempotency-key'] as string || req.body?.idempotencyKey;

    if(!idempotencyKey) {
        const newKey = IdempotencyUtil.generateKey();
        req.headers['x-idempotency-key'] = newKey;
        if(req.body) {
            req.body.idempotencyKey = newKey;
        }
    } else if(!IdempotencyUtil.isValidKey(idempotencyKey)) {
        res.status(400).json({ error: 'Invalid idempotency key format. Must be a valid uuid v4 string' });
        return;
    }

    //it attaches the idempotency key to the request object so downstream handlers
    // (controllers, services, etc.) can access it and read it as req.idempotencyKey

    //Type assertion to attach the idempotency key to the request object
    (req as any).idempotencyKey = req.headers['x-idempotency-key'] || req.body?.idempotencyKey;
    next();
}