export interface IChainSettings {
    chainID: string;
    rpc: string;
    rest: string;
    prefix: string;
    db: string;
    env: string;
    mainNativeDenom: string;
    alternativeFeeDenom?: string;
    explorerURL: string;
    defaultFee: string;
}
