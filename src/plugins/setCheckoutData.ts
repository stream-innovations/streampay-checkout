import { Context } from "@nuxt/types";
import { StreamPayCheckoutManager } from "streampay-checkout-internal";
import theme from "@matterlabs/zksync-nuxt-core/utils/theme";

export default async ({ store }: Context): Promise<void> => {
  if (theme.getUserTheme() === "dark") {
    theme.toggleTheme();
  }
  await store.dispatch("provider/requestProvider");
  await store.dispatch("stream-tokens/loadStreamTokens");
  if (!window.opener || window.opener === window) {
    store.commit("checkout/setError", "Windows isn't a popup. Can't initialize zkCheckoutManager");
    return;
  }
  try {
    const checkoutManager = StreamPayCheckoutManager.getManager();
    checkoutManager.startCheckout((e) => console.log(`Err ${e} has occurred`));
    const state = await checkoutManager.getCheckoutState();
    console.log("Checkout state", state);
    store.commit("checkout/setLinkCheckoutState", false);
    store.dispatch("checkout/setTransactionData", {
      ...state,
      fromAddress: state.userAddress,
    });
    // await store.dispatch("transaction/setType", "TransferBatch", { root: true });
    store.dispatch("checkout/requestUsedTokensPrice");
  } catch (error) {
    console.log("StreamPayCheckoutManager error", error);
    store.commit("checkout/setError", error);
  }
};
