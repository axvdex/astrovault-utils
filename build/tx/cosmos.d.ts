import { IChainSettings } from "../interfaces/global";
import { Coin, DeliverTxResponse, SigningStargateClient, StdFee } from "@cosmjs/stargate";
import { ExecuteInstruction, InstantiateResult } from "@cosmjs/cosmwasm-stargate";
import { Event } from "@cosmjs/stargate";
interface DeliverTxResponseModified extends DeliverTxResponse {
    logs: {
        events: Event[];
    }[];
}
export declare const executeCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
}, senderAddress: string, instructions: ExecuteInstruction[], feeOptions?: {
    gas?: string;
    granter?: string;
}) => Promise<DeliverTxResponseModified>;
export declare const instantiateCosmosContractTx: (client: SigningStargateClient, chainSettings: IChainSettings | {
    prefix: string;
    rest: string;
    mainNativeDenom: string;
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
}, gas: string) => Promise<StdFee>;
export declare const getCosmosGasUnitPrice: (chainSettings: IChainSettings) => Promise<any>;
export {};
