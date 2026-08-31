import { SagaStep } from "../types/saga-steps";
import { SagaContext } from "../types/saga-context";
import { TransactionService } from "../../transaction-service/services/transaction-service";

//Forward Action:
//Check if transaction already exists by idempotency key
//If yes, put it into context and return
//If no, create a new PENDING transaction

//Compensation:
//No direct undo
//The orchestrator can mark transaction FAILED.


export class CreateTransactionStep implements SagaStep {
  private transactionService: TransactionService;

  constructor(transactionService: TransactionService) {
    this.transactionService = transactionService;
  }

  getName(): string {
    return 'CreateTransactionStep';
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    const existing = await this.transactionService.getTransactionByIdempotencyKey(
      context.idempotencyKey, context.fromUser);

    if(existing){
      context.transaction = existing;
      return context;
    }

    const transaction = await this.transactionService.createTransaction(
      context.fromUser, context.toUser, context.amount, context.idempotencyKey);

    context.transaction = transaction;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    //No compensation need for creating a transaction record
    //Transaction can be marked as FAILED by the orchestrator
    //This step is idempotent - creatinf a transaction record doesn't change the state of the system
}
}