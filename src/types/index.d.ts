import { BigNumber } from "ethers";
import { DecimalBalance } from "@matterlabs/zksync-nuxt-core/types";
import { StreamPayTransaction } from "streampay-checkout/build/types";
import { TokenSymbol, Address } from "streampay/build/types";

export type PaymentItem = {
  address: Address;
  token: TokenSymbol;
  amount: DecimalBalance;
};
export type TransactionData = {
  transactions: Array<StreamPayTransaction>;
  fromAddress: Address;
  feeToken: TokenSymbol;
  domains: Map<Address, string>;
};
export type TransactionFee = {
  key: string;
  amount: BigNumber;
  realAmount: BigNumber;
  token: TokenSymbol;
  to?: Address;
};
export type TotalByToken = {
  [token: string]: BigNumber;
};

export type StreamSingleToken = {
  address: string;
  id: number;
  symbol: string;
  decimals: number;
};
// Tokens are indexed by their symbol (e.g. "ETH")
export type StreamTokens = Iterator<string, StreamSingleToken>;

export type SingleRampConfig = {
  url?: string;
  hostApiKey: string;
};
export type RampConfig = {
  goerli: SingleRampConfig;
  mainnet: SingleRampConfig;
};
