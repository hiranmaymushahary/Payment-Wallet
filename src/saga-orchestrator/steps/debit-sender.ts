import { SagaStep } from "../types/saga-steps";
import { SagaContext } from "../types/saga-context";
import { WalletService } from "../../wallet-service/services/wallet-service";
import { ConnectionManager } from "../../shared/database/connection-manager";

//Forward Action:
//Start transaction on sender shard
//Lock sender wallet
//Debit amount
//Write ledger debit
//Mark context.debitCommitted = true

//Failure:
//if sufficient balance, throw

//Compensation:
//If debit commited, credit sender back

export class DebitSenderStep implements SagaStep {
  private walletService: WalletService;
  private connectionManager: ConnectionManager;

  constructor(walletService: WalletService, connectionManager: ConnectionManager) {
    this.walletService = walletService;
    this.connectionManager = connectionManager;
  }

  getName(): string {
    return 'DebitSenderStep';
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if(!context.transaction){
      throw new Error('Transaction not found');
    }

    await this.connectionManager.executeInTransaction(context.fromShardId, async (tx) => {
      const debitWallet = await this.walletService.debit(
        context.fromUser, context.amount, context.transaction!.id, tx);

      if(!debitWallet){
        throw new Error('Insufficient balance or concurrent modification detected');
      }
    });

    context.debitCommitted = true;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if(!context.transaction){
      return;
    }

    //check if debit was commited
    if(context.fromQueryRunner) {
      await (context.fromQueryRunner as any).$rollback();
      context.fromQueryRunner = undefined;
      return;
    }

    if(context.debitCommitted){
      await this.connectionManager.executeInTransaction(context.fromShardId, async (tx) => {
        await this.walletService.credit(
          context.fromUser, context.amount, context.transaction!.id, tx);
      });
    }
  }
}