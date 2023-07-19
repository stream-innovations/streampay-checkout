<template>
  <div class="indexPage">
    <zk-modal
      v-if="modal === 'feeChanged'"
      :value="modal === 'feeChanged'"
      @close="
        modal = false;
        cancelTransfer();
      "
    >
      <template slot="header">
        <div class="withIcon text-warning text-yellow">
          <i class="fad fa-info-square" />
          <div>Fee changed</div>
        </div>
      </template>
      <template slot="default">
        <div class="text-sm">
          The price for StreamPay transactions fluctuates a little bit to make sure that StreamPay runs as close as possible
          to break-even costs.
        </div>
        <div v-if="!transferAllowed" class="text-sm text-red">
          You have to deposit a little bit more to cover new transaction fee.
        </div>
        <div v-for="(item, index) in transactionFees" :key="index" class="mt-3">
          <div class="text-lg">
            {{ item.type === "batch" ? "Batch transaction fee" : "One-time account activation fee" }}
          </div>
          <zk-values-block>
            <template slot="left-top">
              <div class="headline">Previous fee</div>
            </template>
            <template slot="right-top">
              <div class="flex flex-col items-end whitespace-nowrap">
                <div class="value">
                  {{ item.previous | formattedPrice(transactionData.feeToken) }}
                </div>
                <div class="secondaryValue">
                  {{ item.previous | parseBigNumberish(transactionData.feeToken) }} {{ transactionData.feeToken }}
                </div>
              </div>
            </template>
          </zk-values-block>
          <zk-values-block class="mt-1">
            <template slot="left-top">
              <div class="headline">New fee</div>
            </template>
            <template slot="right-top">
              <div class="flex flex-col items-end whitespace-nowrap">
                <div class="value">
                  {{ item.new | formattedPrice(transactionData.feeToken) }}
                </div>
                <div class="secondaryValue">
                  {{ item.new | parseBigNumberish(transactionData.feeToken) }} {{ transactionData.feeToken }}
                </div>
              </div>
            </template>
          </zk-values-block>
        </div>
      </template>
      <template slot="footer">
        <div class="flex items-center justify-center flex-wrap gap-2">
          <zk-defbtn
            outline
            @click="
              modal = false;
              cancelTransfer();
            "
          >
            <i class="far fa-arrow-left" />
            <span>Cancel payment</span>
          </zk-defbtn>
          <zk-defbtn
            v-if="transferAllowed"
            @click="
              modal = false;
              transfer();
            "
          >
            <i class="fas fa-paper-plane" />
            <span>Complete payment</span>
          </zk-defbtn>
        </div>
      </template>
    </zk-modal>

    <zk-modal v-if="errorModal !== false" :value="errorModal !== false" @close="errorModal = false">
      <template slot="header">
        <div class="withIcon text-red">
          <i class="fad fa-info-square" />
          <div>{{ errorModal.headline }}</div>
        </div>
      </template>
      <template slot="default">
        <div class="text-sm">
          {{ errorModal.text }}
        </div>
      </template>
    </zk-modal>

    <connected-wallet />

    <div v-if="step === 'main'" class="w-full">
      <zk-max-height :value="!tokenItemsValid[transactionData.feeToken]" class="mt-5 md:mt-7">
        <div>
          <zk-note class="notificationNote">
            <template slot="icon">
              <i class="text-gray text-xl fal fa-info-square" />
            </template>
            <template slot="default">
              <div class="text-sm text-gray font-light">
                The default recommended <span class="font-normal">{{ transactionData.feeToken }}</span> amount to
                deposit is <span class="font-normal">25% higher</span> than the minimal required one for paying fees to
                take into account the risk of fluctuating transaction fees.
              </div>
            </template>
          </zk-note>
        </div>
      </zk-max-height>

      <line-table-header class="mt-5 mb-2">
        <template slot="first"> To pay</template>
        <template slot="second"> L2 balance</template>
        <template slot="first:md"> To pay / L2 balance</template>
        <template slot="right" />
      </line-table-header>
      <transaction-token
        v-for="token in usedTokens"
        :key="token"
        v-model="tokenItemsValid[token]"
        :token="token"
        :total="totalByToken[token] ? totalByToken[token].toString() : '0'"
      />
      <div class="mainBtnsContainer">
        <div class="mainBtns">
          <zk-defbtn
            v-if="displayActivateAccountBtn"
            :disabled="!transferAllowed || !canSTRM || strmLoading"
            :loader="strmLoading"
            @click="signActivation()"
          >
            <i class="fas fa-unlock"></i>
            <span>{{ strmBtnText }}</span>
          </zk-defbtn>
          <zk-defbtn
            v-else
            :loader="accountStateLoading"
            :disabled="!transferAllowed || accountStateLoading"
            @click="preTransfer()"
          >
            <i class="fas fa-paper-plane" />
            <span>Complete payment</span>
          </zk-defbtn>
        </div>
        <div
          v-if="displayActivateAccountBtn && (!canSTRM || !transferAllowed) && !strmLoading"
          class="text-gray text-center text-sm pt-2"
        >
          Complete all deposit operations to continue
        </div>
      </div>
    </div>
    <div v-else-if="step === 'transfer'" class="w-full">
      <div class="font-firaCondensed font-medium text-3xl text-dark -dark text-center pt-5 md:pt-10">Payment</div>
      <div v-if="subStep === 'processing'" class="text-lg text-center pt-2">Processing...</div>
      <div v-else-if="subStep === 'waitingUserConfirmation'" class="text-lg text-center pt-2">
        Follow the instructions in your wallet
      </div>
      <div v-else-if="subStep === 'committing'" class="text-lg text-center pt-2">
        Waiting for the transactions to be mined...
      </div>
      <zk-loader class="mx-auto mt-6" size="md" color="violet" />
    </div>
    <div v-else-if="step === 'success'" class="successPage w-full">
      <div class="font-firaCondensed font-medium text-3xl text-green text-center pt-5 md:pt-10">Done. Thank you!</div>
      <zk-success-check-mark big class="w-11/12 max-w-xxs mx-auto py-5" />
      <div class="text-md text-center font-light pt-2">
        Wasn't that easy? Learn more about
        <a class="linkDefault lightLink" href="https://streampayments.co/" target="_blank">StreamPay</a>
      </div>
      <div class="mainBtnsContainer">
        <div class="mainBtns">
          <zk-defbtn v-if="!isLinkCheckout" :disabled="!transferAllowed" @click="close()">
            <i class="far fa-times" />
            <span>Close</span>
          </zk-defbtn>
        </div>
      </div>
      <line-table-header class="mt-10 md:mt-7 mb-2">
        <template slot="first"> Paid</template>
        <template slot="second" />
        <template slot="first:md"> &nbsp;</template>
        <template slot="right"> Paid / TX Hash</template>
      </line-table-header>

      <vue-custom-scrollbar class="customScrollList">
        <template v-for="(item, index) in finalTransactions">
          <zk-line-block :key="index">
            <template slot="first">
              <div class="tokenItem">
                <div class="tokenName">
                  {{ item.txData.tx.token ? item.txData.tx.token : item.txData.tx.feeToken }}
                </div>
              </div>
            </template>
            <template slot="second">
              <div class="amount">
                {{
                  item.txData.tx.fee === "0"
                    ? item.txData.tx.amount
                    : item.txData.tx.fee
                      | parseBigNumberish(item.txData.tx.token ? item.txData.tx.token : item.txData.tx.feeToken)
                }}
              </div>
            </template>
            <template slot="third">
              <a class="transactionLink linkDefault" :href="getTxLink(item.txHash)" target="_blank">
                <div class="font-light txHash text-xxs md:text-right">
                  <span class="lightLink">{{ item.txHash | formatTransaction }}</span>
                </div>
                <i class="text-xs text-violet -dark pl-1 fal fa-external-link" />
              </a>
            </template>
          </zk-line-block>
        </template>
      </vue-custom-scrollbar>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import { BigNumberish } from "ethers";
import { Wallet } from "streampay";
import { StreamPayCheckoutManager } from "streampay-checkout-internal";
import { Transaction } from "streampay/build/wallet";
import { STRMStatus } from "@matterlabs/zksync-nuxt-core/types";
import { filterError } from "@matterlabs/zksync-nuxt-core/utils";
import { Address, TokenSymbol } from "streampay/build/types";
import { transactionBatch } from "@/plugins/walletActions/transaction";
import { TotalByToken, TransactionData } from "@/types";
import connectedWallet from "@/blocks/connectedWallet.vue";
import lineTableHeader from "@/blocks/lineTableHeader.vue";

interface UpdatedFee {
  type: "batch" | "strm";
  previous: BigNumberish;
  new: BigNumberish;
}

export default Vue.extend({
  components: {
    connectedWallet,
    lineTableHeader,
  },
  filters: {
    formatTransaction(value: string) {
      return value.replace("streampay-tx:", "");
    },
  },
  data() {
    return {
      modal: false as false | "feeChanged",
      step: "main" as "main" | "transfer" | "success",
      subStep: "" as "processing" | "waitingUserConfirmation" | "committing",
      strmMessageSigned: false,
      updateTransferAllowed: 0,
      strmState: "main" as "main" | "processing" | "waitingUserConfirmation",
      tokenItemsValid: {} as {
        [token: string]: boolean;
      },
      finalTransactions: [] as Array<Transaction>,
      errorModal: false as
        | false
        | {
            headline: string;
            text: string;
          },
      transactionFees: [] as UpdatedFee[],
      accountStateLoading: false,
    };
  },
  computed: {
    loggedIn(): boolean {
      return this.$store.getters["account/loggedIn"];
    },
    address(): Address {
      return this.$store.getters["account/address"];
    },
    strmStatus(): STRMStatus {
      return this.$store.getters["wallet/strm"];
    },
    transactionData(): TransactionData {
      return this.$store.getters["checkout/getTransactionData"];
    },
    usedTokens(): TokenSymbol[] {
      return this.$store.getters["checkout/usedTokens"];
    },
    totalByToken(): TotalByToken {
      // eslint-disable-next-line no-unused-expressions
      this.updateTransferAllowed;
      return this.$store.getters["checkout/getTotalByToken"];
    },
    transferAllowed(): boolean {
      // eslint-disable-next-line no-unused-expressions
      this.updateTransferAllowed;
      const items = Object.entries(this.tokenItemsValid).filter(([token, _]) => this.usedTokens.includes(token));
      for (const [, state] of items) {
        if (!state) {
          return false;
        }
      }
      return this.$store.getters["transaction/commitAllowed"];
    },
    displayActivateAccountBtn(): boolean {
      return this.strmStatus === false;
    },
    canSTRM(): boolean {
      return (
        this.$store.getters["account/accountState"] &&
        typeof this.$store.getters["account/accountState"].id === "number"
      );
    },
    strmLoading(): boolean {
      return this.strmState === "processing" || this.strmState === "waitingUserConfirmation";
    },
    strmBtnText(): string {
      switch (this.strmState) {
        case "processing":
          return "Processing...";
        case "waitingUserConfirmation":
          return "Follow the instructions in your wallet";

        default:
          return "Activate account";
      }
    },
    blockExplorerLink(): string {
      return this.$store.getters["onboard/config"].StreamNetwork.explorer;
    },
    isLinkCheckout(): boolean {
      return this.$store.getters["checkout/isLinkCheckout"];
    },
  },
  watch: {
    step(val) {
      this.$store.commit("setStep", val);
    },
    address(val) {
      if (val && this.loggedIn && this.step === "success") {
        this.step = "main";
      }
    },
  },
  methods: {
    getTokenByID(id: number) {
      return this.$store.getters["stream-tokens/zkTokenByID"](id)?.symbol;
    },
    getTxLink(hash: string) {
      return `${this.blockExplorerLink}explorer/transactions/${hash}`;
    },
    async checkFees() {
      this.transactionFees = [];
      const transactionFeesPrevious = this.$store.getters["checkout/getTransactionBatchFee"].amount;
      const accountUnlockFeePrevious = this.$store.getters["checkout/getAccountUnlockFee"];
      await this.$store.dispatch("transaction/requestAllFees", true);
      const transactionFeesNew = this.$store.getters["checkout/getTransactionBatchFee"].realAmount;
      if (transactionFeesPrevious.lt(transactionFeesNew)) {
        this.transactionFees.push({
          type: "batch",
          previous: transactionFeesPrevious.toString(),
          new: this.$store.getters["checkout/getTransactionBatchFee"].amount.toString(),
        });
      }
      if (this.strmStatus !== true) {
        const accountUnlockFeeNew = this.$store.getters["checkout/getAccountUnlockFee"];
        if (accountUnlockFeePrevious.lt(accountUnlockFeeNew)) {
          this.transactionFees.push({
            type: "strm",
            previous: accountUnlockFeePrevious.toString(),
            new: accountUnlockFeeNew.toString(),
          });
        }
      }
    },
    async preTransfer() {
      try {
        this.accountStateLoading = true;
        await this.$store.dispatch("account/updateAccountState", true);
        this.accountStateLoading = false;
        if (!this.transferAllowed) {
          return;
        }
        this.step = "transfer";
        this.subStep = "processing";
        await this.checkFees();
        if (this.transactionFees.length > 0) {
          this.modal = "feeChanged";
          return;
        }
        this.transfer();
      } catch (error) {
        this.step = "main";
        this.modal = false;
        this.accountStateLoading = false;
        const realError = filterError(error as Error);
        if (realError) {
          this.errorModal = {
            headline: "Error while preparing the transfer",
            text: realError,
          };
        }
      }
    },
    cancelTransfer() {
      this.step = "main";
    },
    async transfer() {
      if (!this.transferAllowed) {
        return;
      }
      const transactionData = this.transactionData;
      this.step = "transfer";
      try {
        const streamWallet: Wallet = this.$store.getters["wallet/streamWallet"];
        const nonce = await streamWallet.getNonce("committed");
        const transactionsList = transactionData.transactions;
        const transactionFees = this.$store.getters["checkout/getTransactionBatchFee"];
        const transactions = await transactionBatch(
          transactionsList,
          transactionData.feeToken,
          transactionFees.realAmount,
          nonce,
          this.$store,
          (step: "waitingUserConfirmation" | "processing") => (this.subStep = step)
        );
        console.log("Batch transaction", transactionsList);

        this.finalTransactions = transactions.map((e) => {
          e.txData.tx.amount = e.txData.tx.amount?.toString();
          e.txData.tx.fee = e.txData.tx.fee?.toString();
          if (typeof e.txData.tx.token === "number") {
            e.txData.tx.tokenId = e.txData.tx.token;
            e.txData.tx.token = this.getTokenByID(e.txData.tx.tokenId);
          }
          if (typeof e.txData.tx.feeToken === "number") {
            e.txData.tx.feeTokenId = e.txData.tx.feeToken;
            e.txData.tx.feeToken = this.getTokenByID(e.txData.tx.feeTokenId);
          }
          return e;
        });
        console.log("finalTransactions", this.finalTransactions);

        const manager = StreamPayCheckoutManager.getManager();
        const validHashes = this.finalTransactions
          .filter((tx: any) => {
            if (tx.txData.tx.type !== "Transfer") {
              return false;
            }
            for (const singleTx of transactionsList) {
              if (
                tx.txData.tx.to?.toLowerCase() === singleTx.to?.toLowerCase() &&
                tx.txData.tx.amount?.toString() === singleTx.amount?.toString() &&
                tx.txData.tx.token === singleTx.token
              ) {
                return true;
              }
            }
            return false;
          })
          .map((tx) => tx.txHash);
        console.log("Sent hashes", validHashes);
        // @ts-ignore
        if (manager.openerPromise) {
          manager.notifyHashes(validHashes);
        }

        this.subStep = "committing";

        await transactions[0].awaitReceipt();
        this.step = "success";
      } catch (error) {
        this.updateTransferAllowed++;
        await this.$store.dispatch("wallet/checkSTRM");
        this.step = "main";
        let realError = filterError(error as Error);
        if (realError) {
          if (realError.includes("Account does not exist in the StreamPay network")) {
            realError = "Please, make deposit or request tokens in order to activate the account.";
          } else if (realError.includes("batch summary fee is too low")) {
            await this.checkFees();
            this.updateTransferAllowed++;
            if (this.transactionFees.length > 0) {
              this.modal = "feeChanged";
              return;
            }
          }
          this.errorModal = {
            headline: "Batch transfer error",
            text: realError,
          };
        }
      }
    },
    async signActivation() {
      this.strmState = "processing";
      try {
        const streamWallet: Wallet = this.$store.getters["wallet/streamWallet"];
        const accountID = await streamWallet.getAccountId();
        if (typeof accountID !== "number") {
          throw new TypeError("It is required to have a history of balances on the account to activate it.");
        }
        this.strmState = "waitingUserConfirmation";
        await this.$store.dispatch("wallet/signSTRM");
        this.strmState = "processing";
        await new Promise((resolve) => {
          // Just for the UX reasons
          setTimeout(() => {
            resolve(undefined);
          }, 500);
        });
        this.strmState = "main";
      } catch (error) {
        this.strmState = "main";
        const realError = filterError(error as Error);
        if (realError) {
          this.errorModal = {
            headline: "Activation error",
            text: realError,
          };
        }
      }
    },
    close() {
      window.close();
    },
  },
});
</script>
