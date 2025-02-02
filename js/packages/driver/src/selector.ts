export type Selector<TSelector = never> =
  | TSelector
  | string
  | {
      selector: TSelector | string
      type?: string
      child?: Selector<TSelector>
      shadow?: Selector<TSelector>
      frame?: Selector<TSelector>
      fallback?: Selector<TSelector>
    }

export type CommonSelector = Selector
