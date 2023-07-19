import { BigNumber } from "ethers";
import { Wallet } from "streampay";
import { StreamPayTransaction } from "streampay-checkout/build/types";
import { submitSignedTransactionsBatch } from "streampay/build/wallet";
import { TokenSymbol, Address } from "streampay/build/types";

/**
 * Transaction processing action
 *
 * @param transactions
 * @param {TokenSymbol} feeToken
 * @param fee
 * @param nonce
 * @param store
 * @param statusFunction
 * @returns {Promise<Transaction | Transaction[]>}
 */
export const transactionBatch = async (
  transactions: Array<StreamPayTransaction>,
  feeToken: TokenSymbol,
  fee: BigNumber,
  nonce: number,
  store: any,
  statusFunction: Function
) => {
  const streamWallet: Wallet = store.getters["wallet/streamWallet"];
  const batchBuilder = streamWallet.batchBuilder(nonce);
  await store.dispatch("transaction/addSTRMToBatch", batchBuilder);
  for (const tx of transactions) {
    batchBuilder.addTransfer({
      fee: 0,
      amount: tx.amount,
      to: tx.to as Address,
      token: tx.token as string,
    });
  }
  batchBuilder.addTransfer({
    fee,
    amount: 0,
    to: streamWallet.address(),
    token: feeToken,
  });
  statusFunction("waitingUserConfirmation");
  const batchTransactionData = await batchBuilder.build();
  statusFunction("processing");
  return await submitSignedTransactionsBatch(
    streamWallet.provider,
    batchTransactionData.txs,
    batchTransactionData.signature ? [batchTransactionData.signature] : undefined
  );
};
