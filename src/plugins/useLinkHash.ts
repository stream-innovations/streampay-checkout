import { Context } from "@nuxt/types";
import { RestProvider } from "zksync";
import { Address } from "streampay/build/types";
import { decrypt } from "@/plugins/link";

export default async ({ store, route, redirect }: Context, hash: string) => {
  const onError = async () => {
    await store.dispatch("openModal", "zkLinkParseFail");
    redirect("/link");
  };
  try {
    store.commit("checkout/setLinkCheckoutState", true);
    const syncProvider: RestProvider = await store.dispatch("provider/requestProvider");
    await store.dispatch("stream-tokens/loadStreamTokens");
    const transactions = await decrypt(hash, syncProvider, store.getters["stream-tokens/zkTokens"]);
    store.commit("checkout/setError", false);
    if (transactions.length === 0) {
      return await onError();
    }
    const totalByToken = Object.fromEntries(transactions.map((e) => [e.token, 0]));
    const domains = new Map<Address, string>();
    transactions.forEach((e) => {
      if (e.domain) {
        domains.set(e.address, e.domain);
      }
    });

    transactions.forEach((e) => totalByToken[e.token]++);
    let highestNumberSymbol = transactions[0].token;
    transactions.forEach((e) => {
      if (totalByToken[highestNumberSymbol] < totalByToken[e.token]) highestNumberSymbol = e.token;
    });
    store.dispatch("checkout/setTransactionData", {
      transactions: transactions.map((e, index) => ({
        to: e.address,
        token: e.token,
        amount: e.amount,
        description: `Payment ${index + 1}`,
      })),
      feeToken: highestNumberSymbol,
      fromAddress: undefined,
      domains,
    });
    store.dispatch("checkout/requestUsedTokensPrice");
    if (store.getters["account/loggedIn"]) {
      await Promise.all([
        store.dispatch("checkout/requestInitialData"),
        store.dispatch("account/updateAccountState", true),
      ]);
    }
    if (!route.path.startsWith("/connect")) {
      redirect({ path: "/connect", query: { link: hash } });
    }
  } catch (error) {
    console.warn("zkLink error", error);
    await onError();
  }
};
