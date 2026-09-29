export type DeleteTickerResult =
  | { status: 'deleted' }
  | { status: 'has_transactions'; transactionCount: number }
  | { status: 'failed'; error: string };

type CountTransactions = (tickerId: string) => Promise<number>;
type DeleteTicker = (tickerId: string) => Promise<void>;

export async function deleteTickerSafely(
  tickerId: string,
  countTransactions: CountTransactions,
  deleteTicker: DeleteTicker,
): Promise<DeleteTickerResult> {
  try {
    const transactionCount = await countTransactions(tickerId);
    if (transactionCount > 0) {
      return { status: 'has_transactions', transactionCount };
    }

    await deleteTicker(tickerId);
    return { status: 'deleted' };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}
