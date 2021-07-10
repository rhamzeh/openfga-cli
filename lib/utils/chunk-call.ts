import chunkArray from './chunk-array';

export async function chunkCall<T>(
  fnToCall: (chunk: T[]) => Promise<any>,
  dataArray: T[],
  maxPerChunk: number,
): Promise<void> {
  const chunkedSet = chunkArray<T>(dataArray, maxPerChunk);
  await Promise.all(chunkedSet.map((chunk) => fnToCall(chunk)));
}
