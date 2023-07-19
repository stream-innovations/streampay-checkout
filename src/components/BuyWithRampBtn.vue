<template>
  <zk-defbtn v-if="isRampSupported" class="rampBtn px-1" @click="buyWithRamp()">
    <img class="mr-2" src="/RampLogo.svg" alt="Ramp" />
    <span>{{ text }} <span class="font-medium"> RAMP</span></span>
  </zk-defbtn>
</template>

<script lang="ts">
import Vue from "vue";
import { RampInstantSDK } from "@ramp-network/ramp-instant-sdk";
import { TokenSymbol } from "streampay/build/types";
import { SingleRampConfig } from "@/types";
import { rampConfig } from "@/plugins/build";

export default Vue.extend({
  props: {
    text: {
      type: String,
      default: "Buy with",
      required: false,
    },
    token: {
      type: String,
      default: "",
      required: false,
    },
  },
  computed: {
    config(): {
      url: string | undefined;
      hostApiKey: string | undefined;
    } | null {
      // @ts-ignore
      return rampConfig[this.$store.getters["provider/network"]] as SingleRampConfig;
    },
    address(): string {
      return this.$store.getters["account/address"];
    },
    allowedRampStreamTokens(): TokenSymbol[] {
      return this.$store.getters["checkout/getAllowedRampStreamTokens"];
    },
    isRampSupported(): boolean {
      return !!this.config;
    },
  },
  methods: {
    buyWithRamp() {
      if (!this.isRampSupported) {
        throw new Error("Ramp is not supported on this environment.");
      }
      new RampInstantSDK({
        hostAppName: "StreamPay Checkout",
        hostLogoUrl: window.location.origin + "/favicon-dark.png",
        variant: "hosted-auto",
        swapAsset: "ZKSYNC_*",
        defaultAsset: this.token ? `ZKSYNC_${this.token}` : undefined,
        userAddress: this.address,
        ...this.config,
      })
        // Weird typing error
        // @ts-ignore
        .on("PURCHASE_SUCCESSFUL", (event) => {
          console.log("Ramp PURCHASE_SUCCESSFUL", event);
          this.$store.dispatch("checkout/requestUsedTokensEthereumBalance", true);
          this.$store.dispatch("account/updateAccountState", true);
        })
        .show();
    },
  },
});
</script>
