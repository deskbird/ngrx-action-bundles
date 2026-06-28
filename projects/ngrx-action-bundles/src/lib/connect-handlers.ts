import { inject } from "@angular/core";
import { Connect } from "./connect.service";
import { BundleFactoryResultValues } from "./types";

export function connectBundles<T extends ReadonlyArray<BundleFactoryResultValues<U>>, U extends string>(bundles: T) {
  const connect = inject(Connect);
  return connect.bundles(bundles);
}

export function connectSelectors<T extends Record<string, (...args: never[]) => unknown>>(selectors: T) {
  const connect = inject(Connect);
  return connect.selectors(selectors);
}

