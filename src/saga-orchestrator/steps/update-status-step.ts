import { SagaStep } from "../types/saga-steps";
import { SagaContext } from "../types/saga-context";
import { TransactionService } from "../../transaction-service/services/transaction-service";
import { TransactionStatus } from "../../shared/types/shared-types";

// Forward Action:
// Update transaction status to DEBITED

export class UpdateStatusDebitedStep implements SagaStep {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService;
  }

  getName(): string {
    return 'UpdateStatusDebitedStep';
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error('Transaction not found');
    }

    const updatedTransaction = await this.transactionService.updateStatus(
      context.transaction.id, TransactionStatus.DEBITED, context.fromUser
    );

    context.transaction = updatedTransaction;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    try {
      await this.transactionService.updateStatus(
        context.transaction.id, TransactionStatus.PENDING, context.fromUser
      );
    } catch (error) {
      console.error('Failed to revert transaction status:', error);
    }
  }
}

export class UpdateStatusCreditedStep implements SagaStep {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService;
  }

  getName(): string {
    return 'UpdateStatusCreditedStep';
  }

  async execute(context: SagaContext): Promise<SagaContext> {
    if (!context.transaction) {
      throw new Error('Transaction not found');
    }

    const updatedTransaction = await this.transactionService.updateStatus(
      context.transaction.id, TransactionStatus.CREDITED, context.fromUser
    );

    context.transaction = updatedTransaction;
    return context;
  }

  async compensate(context: SagaContext): Promise<void> {
    if (!context.transaction) {
      return;
    }

    try {
      await this.transactionService.updateStatus(
        context.transaction.id, TransactionStatus.DEBITED, context.fromUser
      );
    } catch (error) {
      console.error('Failed to revert transaction status:', error);
    }
  }
}