import { Injectable } from "@angular/core";
import { Actions, ofType } from "@ngrx/effects";
import { Action, Selector, Store } from '@ngrx/store'
import { Observable } from "rxjs";
import { BundleFactoryResultValues, ElementOf, SelectorStreams, ListenStreams, UnionToIntersection } from "./types";

/**
 * A callable that produces an action and carries its `type` string. Used to give
 * the values from `Object.entries` a concrete (non-`any`) shape at the dynamic
 * boundary; precise per-action types are reconstructed for callers by the mapped
 * return types (`UnionToIntersection` / `ListenStreams`).
 */
type AnyActionCreator = ((...args: never[]) => Action) & { type: string };

@Injectable({
  providedIn: 'root'
})
export class Connect {

  constructor(private store: Store, private actions: Actions) { }

  bundles<T extends ReadonlyArray<BundleFactoryResultValues<U>>, U extends string>(bundles: T) {

    const result: {
      create: Record<string, (...args: never[]) => Action>;
      dispatch: Record<string, (...args: never[]) => Action>;
      listen: Record<string, Observable<Action>>;
    } = { create: {}, dispatch: {}, listen: {} };
    for (const creators of bundles) {
      for (const [key, creator] of Object.entries(creators)) {
        // `creator` is a union of the bundle's action creators; calling a union
        // of differing signatures isn't expressible, so narrow to a concrete
        // callable shape at this dynamic boundary.
        const actionCreator = creator as AnyActionCreator;
        result.create[key] = (...args) => actionCreator(...args);
        result.dispatch[key] = (...args) => {
          const action = actionCreator(...args);
          this.store.dispatch(action);
          return action;
        };
        result.listen[`${key}$`] = this.actions.pipe(ofType(actionCreator.type));
      }
    }

    return result as unknown as T extends ReadonlyArray<BundleFactoryResultValues<U>> ? {
      create: UnionToIntersection<ElementOf<{ -readonly [P in keyof T]: T[P] }>>,
      dispatch: UnionToIntersection<ElementOf<{ -readonly [P in keyof T]: T[P] }>>,
      listen: ListenStreams<UnionToIntersection<ElementOf<{ -readonly [P in keyof T]: T[P] }>>>
    } : never;
  }

  selectors<T extends Record<string, (...args: never[]) => unknown>>(selectors: T) {
    const result: Record<string, Observable<unknown>> = {};
    for (const [key, selector] of Object.entries(selectors)) {
      // `selector` is widened by `Object.entries`; narrow to the ngrx `Selector`
      // shape `store.select` expects. Precise result types are restored for
      // callers by `SelectorStreams<T>`.
      result[`${key}$`] = this.store.select(selector as Selector<object, unknown>);
    }
    return result as unknown as SelectorStreams<T>;
  }
}
