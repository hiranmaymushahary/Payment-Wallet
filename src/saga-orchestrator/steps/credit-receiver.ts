import { SagaStep } from "../types/saga-steps";
import { SagaContext } from "../types/saga-context";
import { WalletService } from "../../wallet-service/services/wallet-service";
import { connectionManager } from "../../shared/database/connection-manager";

//Forward Action:
//Start transaction on receiver shard
//Lock receiver wallet
//Credit amount
//Write ledger credit

//Compensation:
//If credit commited, debit receiver back.

export class CreditRecevierStep implements SagaStep {
  private walletService: WalletService;

  constructor() {
    this.walletService = new WalletService;
  }

  getName(): string {
    return 'CreditRecevierStep';
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if(!context.transaction){
      throw new Error('Transaction not found');
    }

    await connectionManager.executeInTransaction(context.toShardId, async (tx) => {
      await this.walletService.credit(
        context.toUser, context.amount, context.transaction!.id, tx
      );
    });

    context.creditCommitted = true;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if(!context.transaction){
      return;
    }

    if(context.creditCommitted) {
      await connectionManager.executeInTransaction(context.toShardId, async (tx) => {
        const debitedWallet = await this.walletService.debit(
          context.toUser, context.amount, context.transaction!.id, tx
        );

        if(!debitedWallet){
          //This is a critical failure - receiver received money but can't reverse it
          throw new Error('Failed to compensate credit - manual intervention required');
        }
      });
    }
  }
}