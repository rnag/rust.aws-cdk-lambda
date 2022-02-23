import { performance } from 'perf_hooks';

export function logTime(start: number, message: string) {
    const elapsedSec = ((performance.now() - start) / 1000).toFixed(
        2
    );
    console.log(`${message}: ${elapsedSec}s`);
}
