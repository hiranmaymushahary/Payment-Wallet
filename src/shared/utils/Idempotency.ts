import { v4 as uuidv4 } from 'uuid';

//Idempotency utility
//Generates and validates idempotency keys to ensure operations can be safely retried without side effects

//Idempotency keys are used to:
// - prevent duplicate transactions
// - Enable safe retries in distributed systems
// - track transaction attempts

export class IdempotencyUtil {

    static generateKey(): string {
        return uuidv4();
    }

    static isValidKey(key: string): boolean {
        //a regular expression that enforces the exact UUID v4 format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(key);
    }

}