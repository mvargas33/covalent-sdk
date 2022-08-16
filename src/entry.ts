import { TransactionsResponse, BlockTransactionWithLogEvents } from './models';
import CovalentTransactions from './covalent/CovalentTransactions';

interface TokenInBasket {
  name: string | null;
  symbol: string | null;
  logo_url: string | null;
  contract: string;
}

interface Transfer {
  from_address: string;
  to_address: string;
  token: TokenInBasket;
  amount: string;
  amount_usd: number;
}

interface Transaction {
  timestamp: string;
  block_height: number;
  tx_hash: string;
  transfers?: Transfer[];
}

const simplyfyResponse = (transactions: BlockTransactionWithLogEvents[]): Transaction[] => {
  let txs: Transaction[] = [];
  transactions.map((tx) => {
    let cleanTx: Transaction = {
      timestamp: tx.block_signed_at,
      block_height: tx.block_height,
      tx_hash: tx.tx_hash,
    }
    let transfers: Transfer[] = [];
    tx.log_events.forEach((event) => {
      if (event.decoded === null && tx.value !== "0" && tx.value_quote > 0 && event.sender_name !== null) { // Native token tx
        const newTransfer = {
          from_address: tx.from_address,
          to_address: tx.to_address,
          token: {
            name: event.sender_name,
            symbol: event.sender_contract_ticker_symbol,
            logo_url: event.sender_logo_url,
            contract: event.sender_address,
          },
          amount: tx.value,
          amount_usd: tx.value_quote,
        }
        const transfers_str = transfers.map(transfer => JSON.stringify(transfer))
        if (transfers_str.indexOf(JSON.stringify(newTransfer)) == -1) {
          transfers.push(newTransfer)
        }
      }
    })
    txs.push({...cleanTx, transfers});
  });
  return txs;
}

const API_KEY = "ckey_36106598015249ca9fbbbf08993";
const ADDRESS = "0xcd2f28b4363c183f8798d5d39d0bce6a0ffc71b5";

const getTxs = async (address: string) => {
  console.log(2)
  const transaction = new CovalentTransactions({ key: API_KEY }, 137);
  const result: TransactionsResponse = await transaction.get(ADDRESS);
  // console.log(JSON.stringify(result, null, 2))
  console.log(JSON.stringify(simplyfyResponse(result.items), null, 2));
  return result;
}

getTxs(ADDRESS);

