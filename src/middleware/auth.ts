import { Context } from "@nuxt/types";

export default ({ redirect, store, route }: Context) => {
  if (store.getters["account/loggedIn"]) {
    if (route.path === "/") {
      return redirect("/account");
    }
  } else if (route.path !== "/" && !store.getters["onboard/restoringSession"]) {
    return redirect("/");
  }
};
