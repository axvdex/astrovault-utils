import { IChainSettings } from "../interfaces/global";
const axios = require("axios");
import {
  Coin,
  DeliverTxResponse,
  SigningStargateClient,
  StdFee,
  calculateFee,
  isDeliverTxFailure,
} from "@cosmjs/stargate";
import {
  ExecuteInstruction,
  InstantiateResult,
  MsgInstantiateContractEncodeObject,
  MsgStoreCodeEncodeObject,
  MsgUpdateAdminEncodeObject
} from "@cosmjs/cosmwasm-stargate";
import {
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { Uint53 } from "@cosmjs/math";
import { Event } from "@cosmjs/stargate";
import {
  SigningCosmWasmClient,
  SigningCosmWasmClientOptions,
} from "@cosmjs/cosmwasm-stargate";
import {
  HttpBatchClient,
  HttpBatchClientOptions,
  RpcClient,
  Tendermint37Client,
} from "@cosmjs/tendermint-rpc";
import { EncodeObject, OfflineSigner } from "@cosmjs/proto-signing";

// Functions other than the instantiate and execute function, use the respective client and query the getCosmosTxFees when necessary
const GAS_MULTIPLIER = 1.3;
interface DeliverTxResponseModified extends DeliverTxResponse {
  logs: {
    events: Event[];
  }[];
}

// Generic enough to be used by ALL contract executions
export const executeCosmosContractTx = async (
  client: SigningStargateClient,
  chainSettings:
    | IChainSettings
    | {
      prefix: string;
      rest: string;
      mainNativeDenom: string;
      defaultFee: string
    },
  senderAddress: string,
  instructions: ExecuteInstruction[],
  feeOptions?: {
    useAlternativeFeeDenom?: boolean;
    gas?: string;
    granter?: string;
    gasMultiplier?: number;
  }
): Promise<DeliverTxResponseModified> => {
  const msgs: EncodeObject[] = instructions.map((i) => ({
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: MsgExecuteContract.fromPartial({
      sender: senderAddress,
      contract: i.contractAddress,
      msg: Buffer.from(JSON.stringify(i.msg)),
      funds: [...(i.funds || [])],
    }),
  }));

  const gas = feeOptions?.gas
    ? parseInt(feeOptions?.gas)
    : await client.simulate(senderAddress, msgs, undefined);
  let fee = await getCosmosTxFees(
    chainSettings,
    Math.round(gas * GAS_MULTIPLIER).toString(10),
    feeOptions?.useAlternativeFeeDenom
  );

  if (feeOptions?.granter) {
    fee = {
      ...fee,
      granter: feeOptions.granter,
    };
  }

  const txRaw = await client.sign(senderAddress, msgs, fee, "Astrovault");
  const txBytes = TxRaw.encode(txRaw).finish();
  const res = await client.broadcastTx(
    txBytes,
    client.broadcastTimeoutMs,
    client.broadcastPollIntervalMs
  );

  if (isDeliverTxFailure(res)) {
    throw new Error(createDeliverTxResponseErrorMessage(res));
  }

  return {
    ...res,
    logs: [
      {
        events: [...res.events],
      },
    ],
  };
};

export const storeCosmosContractTx = async (client: SigningStargateClient,
  chainSettings:
    | IChainSettings
    | {
      prefix: string;
      rest: string;
      mainNativeDenom: string;
      defaultFee: string
    },
  senderAddress: string,
  instruction: {
    wasmByteCode: Uint8Array;
  }) => {
  const storeContractMsg: MsgStoreCodeEncodeObject = {
    typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
    value: MsgStoreCode.fromPartial({
      sender: senderAddress,
      wasmByteCode: instruction.wasmByteCode
    }),
  };
  const gas = await client.simulate(
    senderAddress,
    [storeContractMsg],
    undefined
  );
  const fee = await getCosmosTxFees(
    chainSettings,
    Math.round(gas * GAS_MULTIPLIER).toString(10)
  );
  const txRaw = await client.sign(
    senderAddress,
    [storeContractMsg],
    fee,
    "Astrovault"
  );
  const txBytes = TxRaw.encode(txRaw).finish();
  const result = await client.broadcastTx(
    txBytes,
    client.broadcastTimeoutMs,
    client.broadcastPollIntervalMs
  );
  if (isDeliverTxFailure(result)) {
    throw new Error(createDeliverTxResponseErrorMessage(result));
  }

  const storeCodeAttr = result.events
    .find((e) => e.type === "store_code")
    ?.attributes.find((a) => a.key === "code_id");

  return {
    codeId: parseInt(storeCodeAttr!.value),
    height: result.height,
    transactionHash: result.transactionHash,
    msgResponses: result.msgResponses,
    gasWanted: result.gasWanted,
    gasUsed: result.gasUsed,
  }
}

export const updateAdminCosmosContractTx = async (client: SigningStargateClient,
  chainSettings:
    | IChainSettings
    | {
      prefix: string;
      rest: string;
      mainNativeDenom: string;
      defaultFee: string
    },
  senderAddress: string,
  instruction: {
    newAdmin: string;
    contract: string;
  }) => {
  const updateAdminContractMsg: MsgUpdateAdminEncodeObject = {
    typeUrl: "/cosmwasm.wasm.v1.MsgUpdateAdmin",
    value: MsgUpdateAdmin.fromPartial({
      sender: senderAddress,
      newAdmin: instruction.newAdmin,
      contract: instruction.contract
    }),
  };
  const gas = await client.simulate(
    senderAddress,
    [updateAdminContractMsg],
    undefined
  );
  const fee = await getCosmosTxFees(
    chainSettings,
    Math.round(gas * GAS_MULTIPLIER).toString(10)
  );
  const txRaw = await client.sign(
    senderAddress,
    [updateAdminContractMsg],
    fee,
    "Astrovault"
  );
  const txBytes = TxRaw.encode(txRaw).finish();
  const result = await client.broadcastTx(
    txBytes,
    client.broadcastTimeoutMs,
    client.broadcastPollIntervalMs
  );
  if (isDeliverTxFailure(result)) {
    throw new Error(createDeliverTxResponseErrorMessage(result));
  }

  return {
    code: result.code,
    height: result.height,
    transactionHash: result.transactionHash,
    msgResponses: result.msgResponses,
    gasWanted: result.gasWanted,
    gasUsed: result.gasUsed,
  }
}

export const instantiateCosmosContractTx = async (
  client: SigningStargateClient,
  chainSettings:
    | IChainSettings
    | {
      prefix: string;
      rest: string;
      mainNativeDenom: string;
      defaultFee: string
    },
  senderAddress: string,
  instruction: {
    codeId: number;
    msg: any;
    label: string;
    admin?: string;
    funds?: Coin[];
  }
): Promise<InstantiateResult> => {
  const instantiateContractMsg: MsgInstantiateContractEncodeObject = {
    typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
    value: MsgInstantiateContract.fromPartial({
      sender: senderAddress,
      codeId: BigInt(new Uint53(instruction.codeId).toString()),
      label: instruction.label,
      msg: new Buffer(JSON.stringify(instruction.msg)),
      funds: [...(instruction.funds || [])],
      admin: instruction.admin,
    }),
  };
  const gas = await client.simulate(
    senderAddress,
    [instantiateContractMsg],
    undefined
  );
  const fee = await getCosmosTxFees(
    chainSettings,
    Math.round(gas * GAS_MULTIPLIER).toString(10)
  );
  const txRaw = await client.sign(
    senderAddress,
    [instantiateContractMsg],
    fee,
    "Astrovault"
  );
  const txBytes = TxRaw.encode(txRaw).finish();
  const result = await client.broadcastTx(
    txBytes,
    client.broadcastTimeoutMs,
    client.broadcastPollIntervalMs
  );
  if (isDeliverTxFailure(result)) {
    throw new Error(createDeliverTxResponseErrorMessage(result));
  }
  const contractAddressAttr = result.events
    .find((e) => e.type === "instantiate")
    ?.attributes.find((a) => a.key === "_contract_address");
  return {
    contractAddress: contractAddressAttr!.value,
    logs: [],
    height: result.height,
    transactionHash: result.transactionHash,
    events: result.events,
    gasWanted: result.gasWanted,
    gasUsed: result.gasUsed,
  };
};

export const getCosmosTxFees = async (
  chainSettings:
    | IChainSettings
    | {
      prefix: string;
      rest: string;
      mainNativeDenom: string;
      alternativeFeeDenom?: string
      defaultFee: string
    },
  gas: string,
  useAlternativeFeeDenom = false
): Promise<StdFee> => {
  if (chainSettings.prefix === "archway") {
    // on archway gas is sometimes simulated wrong so we up the gas multipler abit
    gas = Math.round(parseInt(gas) * 1.2).toString(10);
    try {
      const res = await axios.default.get(
        chainSettings.rest +
        "/archway/rewards/v1/estimate_tx_fees?gas_limit=" +
        gas
      );

      return {
        amount: res.data.estimated_fee,
        gas,
        granter: undefined,
        payer: undefined,
      };
    } catch (error) {
      return {
        amount: calculateFee(
          Math.round(parseInt(gas) * GAS_MULTIPLIER),
          chainSettings.defaultFee
        ).amount,
        gas,
        granter: undefined,
        payer: undefined,
      };
    }
  }

  if (chainSettings.prefix === "neutron") {
    try {
      const res = await axios.default.get(
        chainSettings.rest +
        "/feemarket/v1/gas_prices"
      );

      const price = res.data.prices.find((priceDenom: any) => priceDenom.denom === (useAlternativeFeeDenom && chainSettings.alternativeFeeDenom ? chainSettings.alternativeFeeDenom :
        chainSettings.mainNativeDenom));

      const feeDenom = price.denom;
      const gasPriceAmount = price.amount;
      const feeAmount = calculateFee(
        Math.round(parseInt(gas) * GAS_MULTIPLIER),
        gasPriceAmount + feeDenom
      );

      return feeAmount;
    } catch (error) {
      return {
        amount: calculateFee(
          Math.round(parseInt(gas) * GAS_MULTIPLIER),
          chainSettings.defaultFee
        ).amount,
        gas,
        granter: undefined,
        payer: undefined,
      };
    }
  }

  if (chainSettings.prefix === "nibi") {
    return calculateFee(
      Math.round(parseInt(gas) * GAS_MULTIPLIER),
      chainSettings.defaultFee
    );
  }

  throw new Error("Fee calculation failed, chain not supported!");
};

export const getCosmosGasUnitPrice = async (chainSettings: IChainSettings) => {
  if (chainSettings.prefix === "archway") {
    try {
      const res = await axios.default.get(
        chainSettings.rest + "/archway/rewards/v1/estimate_tx_fees"
      );
      return res.data.gas_unit_price;
    } catch (error) {
      return calculateFee(
        Math.round(200000 * GAS_MULTIPLIER),
        chainSettings.defaultFee
      ).amount[0];
    }
  }

  if (chainSettings.prefix === "neutron") {
    try {
      const res = await axios.default.get(
        chainSettings.rest +
        "/feemarket/v1/gas_price/" +
        chainSettings.mainNativeDenom
      );
      return res.data.price;
    } catch (error) {
      return calculateFee(
        Math.round(200000 * GAS_MULTIPLIER),
        chainSettings.defaultFee
      ).amount[0];
    }
  }

  if (chainSettings.prefix === "nibi") {
    return calculateFee(
      Math.round(200000 * GAS_MULTIPLIER),
      chainSettings.defaultFee
    ).amount[0];
  }

  return null;
};

function createDeliverTxResponseErrorMessage(
  result: DeliverTxResponse
): string {
  return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}

export const createCosmWasmBatchClient = async (
  rpc: string,
  offlineSigner: OfflineSigner,
  batchClientOptions: HttpBatchClientOptions,
  options: SigningCosmWasmClientOptions
) => {
  const rpcClient: RpcClient = new HttpBatchClient(rpc, batchClientOptions);
  const tmClient = await Tendermint37Client.create(rpcClient);

  return SigningCosmWasmClient.createWithSigner(
    tmClient,
    offlineSigner,
    options
  );
};
