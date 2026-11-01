/**
 * TypeScript declaration shim for @unicitylabs/sphere-sdk/impl/browser/connect
 *
 * This subpath is shipped by the SDK but not declared in its package.json "exports" map.
 * We alias it in vite.config.ts to the physical file.
 * This shim provides the TypeScript types for that aliased module.
 *
 * SDK source: dist/impl/browser/connect/index.js
 * Types:      dist/impl/browser/connect/index.d.ts (which this mirrors)
 */
declare module '@unicitylabs/sphere-sdk/impl/browser/connect' {
  import type {
    ConnectClient,
    ConnectResult,
    PermissionScope,
    NetworkInfo,
    DAppMetadata,
  } from '@unicitylabs/sphere-sdk/connect';

  /** Detected transport type */
  export type DetectedTransport = 'iframe' | 'extension' | 'popup';

  export interface AutoConnectConfig {
    /** dApp metadata sent during handshake. */
    dapp: DAppMetadata;
    /**
     * Wallet URL for popup fallback (P3).
     * The URL will be opened with `/connect?origin=<current origin>` appended.
     * Required if the extension is not installed and the page is not in an iframe.
     */
    walletUrl?: string;
    /** Permissions to request. Defaults to all. */
    permissions?: PermissionScope[];
    /**
     * If true, silently fail if the wallet has not previously approved this origin.
     * No UI will be shown. Useful for auto-connect on page load.
     */
    silent?: boolean;
    /** The network this dApp targets. Required at runtime. */
    network?: NetworkInfo;
    /** Existing session ID to resume. */
    resumeSessionId?: string;
    /** Timeout in ms for query requests and for the connect handshake. Default: 30000. */
    timeout?: number;
    /** Timeout for intent requests in ms. Default: 120000. */
    intentTimeout?: number;
    /** Popup window features. Default: 'width=420,height=720,scrollbars=yes,resizable=yes' */
    popupFeatures?: string;
    /** Force a specific transport instead of auto-detecting. */
    forceTransport?: DetectedTransport;
  }

  export interface AutoConnectResult {
    /** Connected client — use for queries, intents, and events. */
    client: ConnectClient;
    /** Connection result with session info and identity. */
    connection: ConnectResult;
    /** Which transport was selected. */
    transport: DetectedTransport;
    /** Disconnect and clean up all resources. */
    disconnect: () => Promise<void>;
  }

  /** Auto-detect the best transport and connect to the Sphere wallet. */
  export function autoConnect(config: AutoConnectConfig): Promise<AutoConnectResult>;
  /** Returns true when the page is running inside an iframe. */
  export function isInIframe(): boolean;
  /** Returns true when the Sphere browser extension is installed and active. */
  export function hasExtension(): boolean;
  /** Detect which transport to use based on the current environment. */
  export function detectTransport(): DetectedTransport;
}
