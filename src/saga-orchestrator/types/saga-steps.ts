import { SagaContext } from "./saga-context";

//SagaStep is a contract that every saga step must follow so the
//orchestrator can run steps in a
//consistent manner.

//Basic interface for all saga steps
// - execute() > forward logic (what to do)
// - compensate() > rollback logic (how to undo)

//Steps are executed sequentially by the orchestrator.
//If any step fails, compensate() is called on all compensated steps in reverse order


export interface SagaStep {

  execute(context: SagaContext): Promise<SagaContext>;

  compensate(context: SagaContext): Promise<void>;

  //get step name for logging/debugging
  getName(): string; //unique name for the step
}