import { PrismaClient, Prisma } from "../../generated/prisma/client";
import { ShardId } from "../types/shared-types";
import { getPrismaClient } from "./prisma-client";

export class ConnectionManager {
    //the purpose of these also to manage database connection and transactions.

    // get prisma client for a specific shard (for transactional operations)
    getClient(shardId: ShardId): PrismaClient {
        return getPrismaClient(shardId);
    }

    async executeInTransaction<T>(shardId: ShardId, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
        const client = getPrismaClient(shardId)

        return await client.$transaction(fn, {
            isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
        });
    }
}

// fn the work i want to perform inside the transactions.
// tx tx is the prisma client which is connected to current transactions.

//Repeatable Read: while we're inside a transaction, we're guaranteed to see the same data across all reads.


export const connectionManager = new ConnectionManager();