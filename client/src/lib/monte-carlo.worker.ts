/**
 * Monte Carlo Web Worker
 * Runs simulations off main thread to prevent UI blocking
 */

import type { WorkerRequest, WorkerResponse } from './monte-carlo.types';
import { runMonteCarloSimulation } from './monte-carlo';

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, config, requestId } = event.data;

  if (type !== 'RUN_SIMULATION') {
    const errorResponse: WorkerResponse = {
      type: 'SIMULATION_ERROR',
      requestId,
      error: `Unknown message type: ${type}`,
    };
    self.postMessage(errorResponse);
    return;
  }

  try {
    // Send initial progress
    self.postMessage({
      type: 'SIMULATION_PROGRESS',
      requestId,
      progress: 0,
    } as WorkerResponse);

    // Run simulation (blocking in worker context - OK!)
    const results = runMonteCarloSimulation(config);

    // Send completion
    self.postMessage({
      type: 'SIMULATION_COMPLETE',
      requestId,
      results,
      progress: 1,
    } as WorkerResponse);

  } catch (error) {
    self.postMessage({
      type: 'SIMULATION_ERROR',
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    } as WorkerResponse);
  }
};

self.onerror = (error) => {
  console.error('Worker error:', error);
};
