import { TransactionsResponse, BlockTransactionWithLogEvents } from './models';
import CovalentTransactions from './covalent/CovalentTransactions';
import * as fs from 'fs';
const {
  BigNumber,
} = require("@ethersproject/bignumber");

interface UserBalance {
  timestamp: string;
  tokens: Record<string, string>;
}

const calculateUserBalance = (userAddress: string, transactions: Transaction[]): UserBalance[] => {
  const address = userAddress.toLowerCase();
  let balances: UserBalance[] = [];
  transactions.map((tx) => {
    let tokens: Record<string, string> = {}
    tx.transfers?.map((transfer) => {
      if (transfer.to_address.toLowerCase() === address){
        if (tokens.hasOwnProperty(transfer.token.contract)) {
          const newAmount = BigNumber.from(tokens[transfer.token.contract]).add(BigNumber.from(transfer.amount)).toString(); // Use big number
          tokens = {...tokens, [transfer.token.contract]: newAmount}
        } else {
          tokens = {...tokens, [transfer.token.contract]: transfer.amount}
        }
      } else if (transfer.from_address.toLowerCase() === address) {
        if (tokens.hasOwnProperty(transfer.token.contract)) {
          const newAmount = BigNumber.from(tokens[transfer.token.contract]).sub(BigNumber.from(transfer.amount)).toString(); // Use big number
          tokens = {...tokens, [transfer.token.contract]: newAmount}
        } else {
          tokens = {...tokens, [transfer.token.contract]: BigNumber.from(transfer.amount).mul(BigNumber.from(-1)).toString()}
        }
      }
    })
    balances.push({
      timestamp: tx.timestamp,
      tokens
    })
  })
  return balances;
}

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
  log_offset?: number;
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
      let newTransfer: Transfer;
      if (event.decoded === null && tx.value !== "0" && tx.value_quote > 0 && event.sender_name !== null) { // Native token tx
        newTransfer = {
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
          log_offset: event.log_offset,
        }
        const transfers_str = transfers.map(transfer => JSON.stringify({...transfer, log_offset: 0}))
        if (transfers_str.indexOf(JSON.stringify({...newTransfer, log_offset: 0})) == -1) {
          transfers.push(newTransfer)
        }
      } else if (event.decoded !== null && event.decoded.name === "Transfer") {
        newTransfer = {
          from_address: event.decoded.params[0].value,
          to_address: event.decoded.params[1].value,
          token: {
            name: event.sender_name,
            symbol: event.sender_contract_ticker_symbol,
            logo_url: event.sender_logo_url,
            contract: event.sender_address,
          },
          amount: event.decoded.params[2].value,
          amount_usd: 0,
          log_offset: event.log_offset,
        }
        transfers.push(newTransfer)
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
  fs.writeFile(`history.json`, JSON.stringify(result, null, 2), (err) => {
    if(err) console.log('error', err);
  });
  // console.log(JSON.stringify(result, null, 2))
  console.log(JSON.stringify(calculateUserBalance('0xcD2F28b4363c183f8798d5d39d0bcE6a0ffC71B5',simplyfyResponse(result.items)), null, 2));
  return result;
}

getTxs(ADDRESS);

