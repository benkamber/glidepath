import { useRef, useCallback, useEffect } from 'react';
import type {
  SimulationConfig,
  AggregatedResults,
  WorkerRequest,
  WorkerResponse,
} from '@/lib/monte-carlo.types';

// Vite worker import
import MonteCarloWorker from '@/lib/monte-carlo.worker?worker';

interface UseMonteCarloWorkerResult {
  runSimulation: (
    config: SimulationConfig,
    onProgress?: (progress: number) => void
  ) => Promise<AggregatedResults>;
  isWorkerSupported: boolean;
  terminateWorker: () => void;
}

export function useMonteCarloWorker(): UseMonteCarloWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (results: AggregatedResults) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number) => void;
  }>>(new Map());

  const isWorkerSupported = typeof Worker !== 'undefined';

  // Initialize worker
  useEffect(() => {
    if (!isWorkerSupported) return;

    try {
      workerRef.current = new MonteCarloWorker();

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, requestId, results, progress, error } = event.data;
        const pending = pendingRequestsRef.current.get(requestId);

        if (!pending) return;

        switch (type) {
          case 'SIMULATION_PROGRESS':
            if (progress !== undefined && pending.onProgress) {
              pending.onProgress(progress);
            }
            break;

          case 'SIMULATION_COMPLETE':
            if (results) {
              pending.resolve(results);
              pendingRequestsRef.current.delete(requestId);
            }
            break;

          case 'SIMULATION_ERROR':
            pending.reject(new Error(error || 'Unknown error'));
            pendingRequestsRef.current.delete(requestId);
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
        pendingRequestsRef.current.forEach((pending) => {
          pending.reject(new Error('Worker error'));
        });
        pendingRequestsRef.current.clear();
      };

    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [isWorkerSupported]);

  const runSimulation = useCallback(
    (config: SimulationConfig, onProgress?: (progress: number) => void): Promise<AggregatedResults> => {
      if (!workerRef.current) {
        return Promise.reject(new Error('Worker not initialized'));
      }

      return new Promise((resolve, reject) => {
        const requestId = `${Date.now()}-${Math.random()}`;

        pendingRequestsRef.current.set(requestId, { resolve, reject, onProgress });

        const request: WorkerRequest = {
          type: 'RUN_SIMULATION',
          config,
          requestId,
        };

        workerRef.current!.postMessage(request);
      });
    },
    []
  );

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      pendingRequestsRef.current.clear();
    }
  }, []);

  return { runSimulation, isWorkerSupported, terminateWorker };
}
