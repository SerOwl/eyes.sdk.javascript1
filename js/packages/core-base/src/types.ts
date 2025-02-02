import {type MaybeArray, type Region, type Size, type Location} from '@applitools/utils'
import {type Logger} from '@applitools/logger'
import {type Proxy} from '@applitools/req'

export interface ImageTarget {
  image: Buffer | URL | string
  size?: Size
  name?: string
  source?: string
  dom?: string
  locationInViewport?: Location // location in the viewport
  locationInView?: Location // location in view/page
  fullViewSize?: Size // full size of the view/page
  /** @internal */
  isTransformed?: boolean
}

export interface Core<TEyes = Eyes> {
  openEyes(options: {settings: OpenSettings; logger?: Logger}): Promise<TEyes>
  locate<TLocator extends string>(options: {
    target: ImageTarget
    settings: LocateSettings<TLocator>
    logger?: Logger
  }): Promise<LocateResult<TLocator>>
  getAccountInfo(options: {settings: ServerSettings; logger?: Logger}): Promise<AccountInfo>
  closeBatch(options: {settings: MaybeArray<CloseBatchSettings>; logger?: Logger}): Promise<void>
  deleteTest(options: {settings: MaybeArray<DeleteTestSettings>; logger?: Logger}): Promise<void>
  /** @internal */
  logEvent(options: {settings: MaybeArray<LogEventSettings>; logger?: Logger}): Promise<void>
}

export interface Eyes<TTarget = ImageTarget> {
  readonly test: TestInfo
  readonly running: boolean
  readonly aborted: boolean
  readonly closed: boolean
  check(options: {target: TTarget; settings?: CheckSettings; logger?: Logger}): Promise<CheckResult[]>
  checkAndClose(options: {target: TTarget; settings?: CheckSettings & CloseSettings; logger?: Logger}): Promise<TestResult[]>
  locateText?<TPattern extends string>(options: {
    target: TTarget
    settings: LocateTextSettings<TPattern>
    logger?: Logger
  }): Promise<LocateTextResult<TPattern>>
  extractText?(options: {target: TTarget; settings: MaybeArray<ExtractTextSettings>; logger?: Logger}): Promise<string[]>
  close(options?: {settings?: CloseSettings; logger?: Logger}): Promise<TestResult[]>
  abort(options?: {settings?: AbortSettings; logger?: Logger}): Promise<TestResult[]>
}

export interface TestInfo {
  testId: string
  userTestId: string
  batchId: string
  baselineId: string
  sessionId: string
  appId: string
  resultsUrl: string
  isNew: boolean
  keepBatchOpen: boolean
  server: ServerSettings
  account: AccountInfo
  rendererId?: string
  rendererInfo?: {type?: 'web' | 'native'; renderer?: Record<string, any>}
}

export interface ServerSettings {
  serverUrl: string
  apiKey: string
  proxy?: Proxy
  agentId?: string
}

type SessionType = 'SEQUENTIAL' | 'PROGRESSION'
type CustomProperty = {
  name: string
  value: string
}
export type Batch = {
  id?: string
  name?: string
  sequenceName?: string
  startedAt?: Date | string
  notifyOnCompletion?: boolean
  properties?: CustomProperty[]
}
type Environment = {
  os?: string
  osInfo?: string
  hostingApp?: string
  hostingAppInfo?: string
  deviceName?: string
  viewportSize?: Size
  userAgent?: string
  rawEnvironment?: Record<string, any>
  rendererId?: string
  rendererInfo?: {
    type?: 'web' | 'native'
    renderer?: Record<string, any>
  }
}
export interface OpenSettings extends ServerSettings {
  appName: string
  testName: string
  displayName?: string
  /** @internal */
  userTestId?: string
  sessionType?: SessionType
  properties?: CustomProperty[]
  batch?: Batch
  keepBatchOpen?: boolean
  environment?: Environment
  environmentName?: string
  baselineEnvName?: string
  branchName?: string
  parentBranchName?: string
  baselineBranchName?: string
  compareWithParentBranch?: boolean
  /** @internal */
  gitBranchingTimestamp?: string
  ignoreGitBranching?: boolean
  ignoreBaseline?: boolean
  saveDiffs?: boolean
  abortIdleTestTimeout?: number
  connectionTimeout?: number
  removeSession?: boolean
}

export interface LocateSettings<TLocator extends string, TRegion = Region> extends ServerSettings, ImageSettings<TRegion> {
  appName: string
  locatorNames: TLocator[]
  firstOnly?: boolean
  /** @internal */
  userLocateId?: string
}

export type LocateResult<TLocator extends string> = Record<TLocator, Region[]>

export interface CloseBatchSettings extends ServerSettings {
  batchId: string
}

export interface DeleteTestSettings extends ServerSettings {
  testId: string
  batchId: string
  secretToken: string
}

export interface LogEventSettings extends ServerSettings {
  event: {type: string} & Record<string, any>
  level?: 'Info' | 'Notice' | 'Warn' | 'Error'
  timestamp?: string
}

export interface AccountInfo {
  ufg: {
    serverUrl: string // serviceUrl
    accessToken: string // accessToken
  }
  rcaEnabled: boolean
  stitchingServiceUrl: string
  uploadUrl: string // resultsUrl
  maxImageHeight: number
  maxImageArea: number
}

type ImageRotation = -270 | -180 | -90 | 0 | 90 | 180 | 270
type OffsetRect = {
  top?: number
  right?: number
  bottom?: number
  left?: number
}
type ImageCropRect = OffsetRect
type ImageCropRegion = Region
export interface ImageSettings<TRegion = Region> {
  region?: TRegion
  normalization?: {
    cut?: ImageCropRect | ImageCropRegion
    rotation?: ImageRotation
    scaleRatio?: number
  }
  autProxy?: Proxy
  debugImages?: {path: string; prefix?: string}
}

type MatchLevel = 'None' | 'Layout' | 'Layout1' | 'Layout2' | 'Content' | 'IgnoreColors' | 'Strict' | 'Exact'
type AccessibilityRegionType = 'IgnoreContrast' | 'RegularText' | 'LargeText' | 'BoldText' | 'GraphicalObject'
type AccessibilityLevel = 'AA' | 'AAA'
type AccessibilityGuidelinesVersion = 'WCAG_2_0' | 'WCAG_2_1'
type CodedRegion<TRegion = Region> = {region: TRegion; padding?: number | OffsetRect; regionId?: string}
type FloatingRegion<TRegion = Region> = CodedRegion<TRegion> & {offset?: OffsetRect}
type AccessibilityRegion<TRegion = Region> = CodedRegion<TRegion> & {type?: AccessibilityRegionType}
export interface CheckSettings<TRegion = Region> extends ImageSettings<TRegion> {
  name?: string
  ignoreRegions?: (TRegion | CodedRegion<TRegion>)[]
  layoutRegions?: (TRegion | CodedRegion<TRegion>)[]
  strictRegions?: (TRegion | CodedRegion<TRegion>)[]
  contentRegions?: (TRegion | CodedRegion<TRegion>)[]
  floatingRegions?: (TRegion | FloatingRegion<TRegion>)[]
  accessibilityRegions?: (TRegion | AccessibilityRegion<TRegion>)[]
  accessibilitySettings?: {level?: AccessibilityLevel; version?: AccessibilityGuidelinesVersion}
  matchLevel?: MatchLevel
  sendDom?: boolean
  useDom?: boolean
  enablePatterns?: boolean
  ignoreCaret?: boolean
  ignoreDisplacements?: boolean
  pageId?: string
  /** @internal */
  stepIndex?: number
  /** @internal */
  renderId?: string
  /** @internal */
  userCommandId?: string
  /** @internal */
  ignoreMismatch?: boolean
  /** @internal */
  ignoreMatch?: boolean
  /** @internal */
  forceMismatch?: boolean
  /** @internal */
  forceMatch?: boolean
}

export interface CheckResult {
  readonly asExpected: boolean
  readonly windowId?: number
  readonly userTestId: string
}

export interface LocateTextSettings<TPattern extends string, TRegion = Region> extends ImageSettings<TRegion> {
  patterns: TPattern[]
  ignoreCase?: boolean
  firstOnly?: boolean
  language?: string
  /** @internal */
  userCommandId?: string
}

type TextRegion = Region & {text: string}
export type LocateTextResult<TPattern extends string> = Record<TPattern, TextRegion[]>

export interface ExtractTextSettings<TRegion = Region> extends ImageSettings<TRegion> {
  hint?: string
  minMatch?: number
  language?: string
  /** @internal */
  userCommandId?: string
}

export interface CloseSettings {
  updateBaselineIfNew?: boolean
  updateBaselineIfDifferent?: boolean
  /** @internal */
  userCommandId?: string
}

export interface AbortSettings {
  /** @internal */
  userCommandId?: string
}

type TestResultsStatus = 'Passed' | 'Unresolved' | 'Failed'
type AccessibilityStatus = 'Passed' | 'Failed'
type StepInfo = {
  readonly name?: string
  readonly isDifferent?: boolean
  readonly hasBaselineImage?: boolean
  readonly hasCurrentImage?: boolean
  readonly appUrls?: AppUrls
  readonly apiUrls?: ApiUrls
  readonly renderId?: string[]
}
type ApiUrls = {
  readonly baselineImage?: string
  readonly currentImage?: string
  readonly checkpointImage?: string
  readonly checkpointImageThumbnail?: string
  readonly diffImage?: string
}
type AppUrls = {
  readonly step?: string
  readonly stepEditor?: string
}
type SessionUrls = {
  readonly batch?: string
  readonly session?: string
}
export interface TestResult {
  readonly id?: string
  readonly userTestId?: string
  readonly name?: string
  readonly secretToken?: string
  readonly status?: TestResultsStatus
  readonly appName?: string
  readonly batchId?: string
  readonly batchName?: string
  readonly branchName?: string
  readonly hostOS?: string
  readonly hostApp?: string
  readonly hostDisplaySize?: Size
  readonly accessibilityStatus?: {
    readonly level: AccessibilityLevel
    readonly version: AccessibilityGuidelinesVersion
    readonly status: AccessibilityStatus
  }
  readonly startedAt?: Date | string
  readonly duration?: number
  readonly isNew?: boolean
  readonly isDifferent?: boolean
  readonly isAborted?: boolean
  readonly appUrls?: SessionUrls
  readonly apiUrls?: SessionUrls
  readonly stepsInfo?: StepInfo[]
  readonly steps?: number
  readonly matches?: number
  readonly mismatches?: number
  readonly missing?: number
  readonly exactMatches?: number
  readonly strictMatches?: number
  readonly contentMatches?: number
  readonly layoutMatches?: number
  readonly noneMatches?: number
  readonly url?: string
}
