import { IChainSettings } from "../interfaces/global";
import { Coin, DeliverTxResponse, SigningStargateClient, StdFee } from "@cosmjs/stargate";
import { ExecuteInstruction, InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import { Event } from "@cosmjs/stargate";
import { SigningCosmWasmClient, SigningCosmWasmClientOptions } from "@cosmjs/cosmwasm-stargate";
import { HttpBatchClientOptions } from "@cosmjs/tendermint-rpc";
import { OfflineSigner } from "@cosmjs/proto-signing";
interface DeliverTxResponseModified extends DeliverTxResponse {
    logs: {
        events: Event[];
    }[];
}
export declare const executeCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
    defaultFee: string;
}, senderAddress: string, instructions: ExecuteInstruction[], feeOptions?: {
    useAlternativeFeeDenom?: boolean;
    gas?: string;
    granter?: string;
    gasMultiplier?: number;
}) => Promise<DeliverTxResponseModified>;
export declare const storeCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
    defaultFee: string;
}, senderAddress: string, instruction: {
    wasmByteCode: Uint8Array;
}) => Promise<{
    codeId: number;
    height: number;
    transactionHash: string;
    msgResponses: {
        readonly typeUrl: string;
        readonly value: Uint8Array;
    }[];
    gasWanted: bigint;
    gasUsed: bigint;
}>;
export declare const updateAdminCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
    defaultFee: string;
}, senderAddress: string, instruction: {
    newAdmin: string;
    contract: string;
}) => Promise<{
    code: number;
    height: number;
    transactionHash: string;
    msgResponses: {
        readonly typeUrl: string;
        readonly value: Uint8Array;
    }[];
    gasWanted: bigint;
    gasUsed: bigint;
}>;
export declare const instantiateCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
    defaultFee: string;
}, senderAddress: string, instruction: {
    codeId: number;
    msg: any;
    label: string;
    admin?: string;
    funds?: Coin[];
}) => Promise<InstantiateResult>;
export declare const getCosmosTxFees: (chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
    alternativeFeeDenom?: string;
    defaultFee: string;
}, gas: string, useAlternativeFeeDenom?: boolean) => Promise<StdFee>;
export declare const getCosmosGasUnitPrice: (chainSettings: IChainSettings) => Promise<any>;
export declare const createCosmWasmBatchClient: (rpc: string, offlineSigner: OfflineSigner, batchClientOptions: HttpBatchClientOptions, options: SigningCosmWasmClientOptions) => Promise<SigningCosmWasmClient>;
export {};
