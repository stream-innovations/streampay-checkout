<template>
  <div v-if="version" class="system-info">
    <v-popover popover-class="system-env-popover" trigger="hover" :width="230" :placement="'top'">
      <div slot="popover" class="flex-col items-stretch p-2 text-xs">
        <div class="text-left text-sm mb-2">Environment details</div>
        <div class="flex flex-auto">
          StreamPay: <strong class="ml-auto">v.{{ LibVersion }}</strong>
        </div>
        <div class="flex flex-auto">
          ETH: <strong class="ml-auto">{{ netName }}</strong>
        </div>
        <div class="flex flex-auto whitespace-nowrap">
          API:&nbsp;<strong class="ml-auto">{{ ApiBase.replace("https://", "") }}</strong>
        </div>
      </div>
      <a class="version"> v.{{ version }} </a>
    </v-popover>

    <span class="mx-3 md:mx-2">|</span>
    <a :href="githubLink" class="revision lightLink" target="_blank">
      <i class="fab fa-github align-self-start" />
      {{ revision }}
    </a>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { Config } from "@matterlabs/zksync-nuxt-core/types";
import { GIT_REVISION_SHORT, VERSION, LIB_VERSION } from "@/plugins/build";

export default Vue.extend({
  computed: {
    config(): Config {
      return this.$store.getters["onboard/config"];
    },
    netName(): string {
      return this.config.ethereumNetwork.name;
    },
    LibVersion(): string {
      return LIB_VERSION;
    },
    version(): string {
      return VERSION;
    },
    githubLink(): string | undefined {
      return `https://github.com/stream-innovations/stream-pay-checkout/commit/${this.revision}`;
    },
    revision(): string {
      return GIT_REVISION_SHORT;
    },
    ApiBase(): string {
      return this.config.StreamNetwork.api;
    },
  },
});
</script>
