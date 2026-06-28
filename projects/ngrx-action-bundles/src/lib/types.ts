import { ActionCreator, ActionCreatorProps, NotAllowedCheck } from "@ngrx/store";
import { TypedAction } from "@ngrx/store/src/models";
import { Observable } from "rxjs";
import { forNamespace } from "./bundle-factory";

export type ALLOWED_DEPTHS = ElementOf<Range<90>>;

export type ElementOf<T> = T extends (infer E)[] ? E : T;

export type UnionToIntersection<U> =
  (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

export type ValueOf<T> = T[keyof T];

export type BundleFactoryResult<T extends string> = ReturnType<typeof forNamespace<T>>;
export type BundleFactoryResultValues<T extends string = ''> = ReturnType<ValueOf<BundleFactoryResult<T>>>;

// `(...args: never[]) => infer R` matches *any* function regardless of its
// parameter types and infers its return type. `never` is the correct top type
// in this (contravariant) matcher position: an action creator `(props: P) => A`
// is assignable to `(...args: never[]) => unknown` but NOT to
// `(...args: unknown[]) => unknown` (that would require `P` to accept `unknown`),
// which would silently collapse every prop-ful creator to `never`.
export type ListenStreams<T> = { [K in keyof T & string as `${K}$`]:
  Observable<T[K] extends (...args: never[]) => infer R ? R : never>;
};

export type SelectorStreams<T> = {
  [K in keyof T & string as `${K}\$`]: T[K] extends (...args: never[]) => infer U ? Observable<U> : never
}

type LengthOf<T extends unknown[]> = T["length"];

type Unshift<List extends unknown[], Item> =
  ((first: Item, ...rest: List) => unknown) extends ((...list: infer R) => unknown) ? R : never;

type Equals<T, S> =
  [T] extends [S] ? (
    [S] extends [T] ? true : false
  ) : false;

export type Range<N, T extends number[] = []> = {
  0: T,
  1: Range<N, Unshift<T, LengthOf<T>>>,
}[Equals<LengthOf<Tail<T>>, N> extends true ? 0 : 1];


type Head<T extends unknown[]> = T extends [head: infer HEAD, ...tail: unknown[]] ? HEAD : never;
type Tail<T extends unknown[]> = T extends [head: unknown, ...tail: infer TAIL] ? TAIL : never;

export type Filter<T extends unknown[], F> =
  LengthOf<T> extends 0 ? [] :
  Head<T> extends F ? [...Filter<Tail<T>, F>] :
  [Head<T>, ...Filter<Tail<T>, F>];

type Join<T extends string[]> =
  LengthOf<T> extends 0 ? '' :
  Head<T> extends string ? Tail<T> extends Array<string> ? `${Head<T>}${Join<Tail<T>>}` :
  never : never;

export type Split<S extends string, D extends string> =
  string extends S ? string[] :
  S extends '' ? [] :
  S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type CapitalizeFirstLetter<T extends string> = `${Capitalize<Head<Split<T, ''>>>}${Join<Tail<Split<T, ''>>>}`;
type LowercaseFirstLetter<T extends string> = `${Lowercase<Head<Split<T, ''>>>}${Join<Tail<Split<T, ''>>>}`;
type CapitalizeArrayItemsFirstLetter<T extends string[]> =
  LengthOf<T> extends 0 ? [] :
  Head<T> extends string ? Tail<T> extends Array<string> ?
  [CapitalizeFirstLetter<Head<T>>, ...CapitalizeArrayItemsFirstLetter<Tail<T>>]
  : never : never;

export type FunctionNameFromStringArray<T extends string[]> =
  Head<T> extends string ? Tail<T> extends Array<string> ? CapitalizeArrayItemsFirstLetter<Tail<T>> extends string[] ?
  Join<[LowercaseFirstLetter<Head<T>>, ...CapitalizeArrayItemsFirstLetter<Tail<T>>]> : never : never : never;

export type FunctionNameFromString<T extends string> =
  Filter<Split<T, ' '>, ''> extends string[] ?
  FunctionNameFromStringArray<Filter<Split<T, ' '>, ''>> :
  never;

// Custom Action Creators for actions with auto timestamp
export declare function createActionWithTimestamp<
  T extends string
>(type: T): ActionCreator<
  T,
  () => { timestamp: number } & TypedAction<T>
>;

export declare function createActionWithTimestamp<
  T extends string,
  P extends object
>(
  type: T,
  config: ActionCreatorProps<P> & NotAllowedCheck<P>
): ActionCreator<
  T,
  (props: P & NotAllowedCheck<P>) => P & { timestamp: number } & TypedAction<T>
>;

