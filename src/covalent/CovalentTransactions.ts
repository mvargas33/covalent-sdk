import { CovalentOptions, CovalentTransactionOptions, TransactionsResponse } from "../models";
import { fetchFromCovalent } from "../utils";

class CovalentTransactions {
  private options: CovalentOptions;
  private chainId: number;

  constructor(options: CovalentOptions, chainId: number) {
    this.options = options;
    this.chainId = chainId;
  }

  async get(address: string, parameters?: CovalentTransactionOptions) {
    const path = `${this.chainId}/address/${address}/transactions_v2`;
    console.log(path)
    const result = await fetchFromCovalent({ ...this.options, path, parameters });
    return result as TransactionsResponse;
  }
}

export default CovalentTransactions;
