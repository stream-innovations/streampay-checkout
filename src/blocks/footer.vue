<template>
  <footer class="FooterContainer flex justify-between items-center pt-1 md:py-5">
    <block-bottom-menu v-if="fullFooterMenu" />
    <div id="built-by-stream-protocol" class="whitespace-nowrap whitespace-nowrap">
      <span class="desktopOnly">Made with ❤️&nbsp;</span
      ><a href="https://streamprotocol.org" target="_blank" class="lightLink">by&nbsp;Stream&nbsp;Protocol</a>
    </div>
    <div class="rightSide">
      <block-system-info />
      <span class="mx-2 md:mx-2">|</span>
      <a href="https://uptime.com/s/StreamPay" class="lightLink" target="_blank"
        >up<span class="desktopOnly">time</span></a
      >
    </div>
  </footer>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  props: {
    fullFooterMenu: {
      type: Boolean,
      default: false,
      required: false,
    },
  },
});
</script>
