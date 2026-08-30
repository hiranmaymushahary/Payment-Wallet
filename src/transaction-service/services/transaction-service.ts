import { TransactionRepository } from "../../shared/repositories/transaction-repository";
import { Transaction, TransactionStatus, ShardId } from "../../shared/types/shared-types";
import { connectionManager } from "../../shared/database/connection-manager";
import { ShardResolver } from "../../shared/database/shard-resolver";

export class TransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  // Create Transaction
  // 1. Determine sender shard from fromUser
  // 2. Start transaction on that shard
  // 3. Check existing transaction by idempotency key
  // 4. If found, return it
  // 5. Otherwise, create a new PENDING row

  async createTransaction(
    fromUser: bigint,
    toUser: bigint,
    amount: bigint,
    idempotencyKey: string
  ): Promise<Transaction> {
    const shardId = ShardResolver.getShardId(fromUser);

    return await connectionManager.executeInTransaction(shardId, async (tx) => {
      const existing = await this.transactionRepository.findByIdempotencyKey(idempotencyKey, tx);
      if (existing) {
        return existing; // return existing transaction
      }

      return await this.transactionRepository.create(fromUser, toUser, amount, idempotencyKey, tx);
    });
  }

  // update transaction status
  // 1. determine sender shard
  // 2. update transaction status
  // PENDING > DEBITED > CREDITED
  // PENDING > FAILED
  // DEBITED > FAILED (after timeout)
  async updateStatus(transactionId: bigint, status: TransactionStatus, fromUser: bigint): Promise<Transaction> {
    const shardId = ShardResolver.getShardId(fromUser);
    return await connectionManager.executeInTransaction(shardId, async (tx) => {
      const transaction = await this.transactionRepository.updateStatus(transactionId, status, tx);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return transaction;
    });
  }

  //getHistory
  //Calls repository history method that queries both shards
  async getHistory(userId: bigint): Promise<Transaction[]> {
    const client1 = connectionManager.getClient(ShardId.SHARD_1);
    const client2 = connectionManager.getClient(ShardId.SHARD_2);
    return await this.transactionRepository.getHistory(userId, client1, client2);
  }

  async getTransactionByIdempotencyKey(idempotencyKey: string, fromUser: bigint): Promise<Transaction | null> {
    const shardId = ShardResolver.getShardId(fromUser);
    const client = connectionManager.getClient(shardId);

    return await this.transactionRepository.findByIdempotencyKey(idempotencyKey, client);
  }

  async getTransaction(transactionId: bigint, fromUser: bigint): Promise<Transaction | null> {
    const shardId = ShardResolver.getShardId(fromUser);
    const client = connectionManager.getClient(shardId);

    return await this.transactionRepository.findById(transactionId, client);
  }
}