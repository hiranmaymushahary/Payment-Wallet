import { Transaction, ShardId } from "../../shared/types/shared-types";

//It currently any as a placeholder.
//After the prisma client generation, it would become Prisma.TransactionClient
type PrismaTransactionClient = any;


export interface SagaContext {
  transaction?: Transaction;
  fromShardId: ShardId;
  toShardId: ShardId;
  fromUser: bigint;
  toUser: bigint;
  amount: bigint;
  idempotencyKey: string;
  //Prisma transactions are handled internally via executeInTransaction
  //These fields are kept for compatability but not actively used in prisma implementation
  fromQueryRunner?: PrismaTransactionClient;
  toQueryRunner?: PrismaTransactionClient;
  debitCommitted?: boolean; //record whether the debit step actually committed
  creditCommitted?: boolean; //record whether the credit step actually committed
  [key: string]: any; //additional fields can be added to the context as needed
}