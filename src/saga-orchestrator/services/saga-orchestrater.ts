import { TransactionService } from "../../transaction-service/services/transaction-service";
import { CreateTransactionStep } from "../steps/create-transaction-step";
import { CreditRecevierStep } from "../steps/credit-receiver";
import { DebitSenderStep } from "../steps/debit-sender-step";
import { UpdateStatusCreditedStep, UpdateStatusDebitedStep } from "../steps/update-status-step";
import { SagaStep } from "../types/saga-steps";
import { ShardResolver } from "../../shared/database/shard-resolver";
import { SagaContext } from "../types/saga-context";
import { TransactionStatus } from "../../shared/types/shared-types";


export class SagaOrchestrator {
    private transactionservice : TransactionService;
    private steps: SagaStep[];


    constructor(){
        this.transactionservice = new TransactionService();

        this.steps = [
            new CreateTransactionStep(),
            new DebitSenderStep(),
            new UpdateStatusCreditedStep(),
            new CreditRecevierStep(),
            new UpdateStatusDebitedStep(),
        ]
    }


    async transfer(
        fromUser : bigint,
        toUser : bigint,
        amount : bigint,
        idempotencyKey : string, 
    ):Promise<any>{
        if(amount <=0){
            throw new Error("Amount must be positive");
        }
        if(fromUser == toUser){
            throw new Error("u can credit urself");
        }

        const  fromShardId = ShardResolver.getShardId(fromUser);
        const  toShardId = ShardResolver.getShardId(toUser); 

        const context : SagaContext = {
            fromUser,
            toUser,
            amount,
            idempotencyKey,
            fromShardId,
            toShardId,
        }
        const completedSteps : SagaStep[] = [];
        let currentStepIndex = -1;

        try{
            for (let i = 0 ; i<this.steps.length;i++){
                const steps = this.steps[i];
                currentStepIndex = i;

                console.log(`Execute step ${i+1}/${this.steps.length}:${steps.getName()}`);


                if(context.transaction){

                    const status = context.transaction.status;

                    if(status== TransactionStatus.CREDITED){
                        return context.transaction;
                    }
                    if(status== TransactionStatus.FAILED){
                        throw new Error ("Transaction Failed");
                    }
                    if(status== TransactionStatus.DEBITED){
                        if(i<3){
                            continue;
                        }
                    }
                }
                const updatedContext = await steps.execute(context);
                Object.assign(context , updatedContext);
                completedSteps.push(steps);
            }
            if(!context.transaction){
                throw new Error("Transaction not found after saga execution");
            }

            return context.transaction;

        } catch(error){

            await this.compensate(completedSteps,context);

            if(context.transaction){
                try{
                    await this.transactionservice.updateStatus(
                        context.transaction.id,
                        TransactionStatus.FAILED,
                        fromUser
                    );
                } catch(updateError){

                }
            }
            throw error;
        }
    }

    private async compensate(completedSteps: SagaStep[], context: SagaContext): Promise<void> {
        for (let i = completedSteps.length - 1; i >= 0; i--) {
            const step = completedSteps[i];

            try {
                console.log(`Compensating step: ${step.getName()}`);
                await step.compensate(context);
            } catch (compensateError) {
                console.error(`Failed to compensate step ${step.getName()}:`, compensateError);

                if (step.getName() === 'DebitSenderStep') {
                    console.log('CRITICAL: Failed to compensate debit - manual intervention required');
                }
            }
        }
    }

    getSteps(): SagaStep[] {
        return this.steps;
    }
}