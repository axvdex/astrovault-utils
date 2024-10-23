"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCosmWasmBatchClient = exports.getCosmosGasUnitPrice = exports.getCosmosTxFees = exports.instantiateCosmosContractTx = exports.updateAdminCosmosContractTx = exports.storeCosmosContractTx = exports.executeCosmosContractTx = void 0;
const axios = require("axios");
const stargate_1 = require("@cosmjs/stargate");
const tx_1 = require("cosmjs-types/cosmwasm/wasm/v1/tx");
const tx_2 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const math_1 = require("@cosmjs/math");
const cosmwasm_stargate_1 = require("@cosmjs/cosmwasm-stargate");
const tendermint_rpc_1 = require("@cosmjs/tendermint-rpc");
// Functions other than the instantiate and execute function, use the respective client and query the getCosmosTxFees when necessary
const GAS_MULTIPLIER = 1.3;
// Generic enough to be used by ALL contract executions
const executeCosmosContractTx = async (client, chainSettings, senderAddress, instructions, feeOptions) => {
    const msgs = instructions.map((i) => ({
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: tx_1.MsgExecuteContract.fromPartial({
            sender: senderAddress,
            contract: i.contractAddress,
            msg: Buffer.from(JSON.stringify(i.msg)),
            funds: [...(i.funds || [])],
        }),
    }));
    const gas = (feeOptions === null || feeOptions === void 0 ? void 0 : feeOptions.gas)
        ? parseInt(feeOptions === null || feeOptions === void 0 ? void 0 : feeOptions.gas)
        : await client.simulate(senderAddress, msgs, undefined);
    let fee = await (0, exports.getCosmosTxFees)(chainSettings, Math.round(gas * GAS_MULTIPLIER).toString(10), feeOptions === null || feeOptions === void 0 ? void 0 : feeOptions.useAlternativeFeeDenom);
    if (feeOptions === null || feeOptions === void 0 ? void 0 : feeOptions.granter) {
        fee = {
            ...fee,
            granter: feeOptions.granter,
        };
    }
    const txRaw = await client.sign(senderAddress, msgs, fee, "Astrovault");
    const txBytes = tx_2.TxRaw.encode(txRaw).finish();
    const res = await client.broadcastTx(txBytes, client.broadcastTimeoutMs, client.broadcastPollIntervalMs);
    if ((0, stargate_1.isDeliverTxFailure)(res)) {
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
exports.executeCosmosContractTx = executeCosmosContractTx;
const storeCosmosContractTx = async (client, chainSettings, senderAddress, instruction) => {
    var _a;
    const storeContractMsg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgStoreCode",
        value: tx_1.MsgStoreCode.fromPartial({
            sender: senderAddress,
            wasmByteCode: instruction.wasmByteCode
        }),
    };
    const gas = await client.simulate(senderAddress, [storeContractMsg], undefined);
    const fee = await (0, exports.getCosmosTxFees)(chainSettings, Math.round(gas * GAS_MULTIPLIER).toString(10));
    const txRaw = await client.sign(senderAddress, [storeContractMsg], fee, "Astrovault");
    const txBytes = tx_2.TxRaw.encode(txRaw).finish();
    const result = await client.broadcastTx(txBytes, client.broadcastTimeoutMs, client.broadcastPollIntervalMs);
    if ((0, stargate_1.isDeliverTxFailure)(result)) {
        throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    const storeCodeAttr = (_a = result.events
        .find((e) => e.type === "store_code")) === null || _a === void 0 ? void 0 : _a.attributes.find((a) => a.key === "code_id");
    return {
        codeId: parseInt(storeCodeAttr.value),
        height: result.height,
        transactionHash: result.transactionHash,
        msgResponses: result.msgResponses,
        gasWanted: result.gasWanted,
        gasUsed: result.gasUsed,
    };
};
exports.storeCosmosContractTx = storeCosmosContractTx;
const updateAdminCosmosContractTx = async (client, chainSettings, senderAddress, instruction) => {
    const updateAdminContractMsg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgUpdateAdmin",
        value: tx_1.MsgUpdateAdmin.fromPartial({
            sender: senderAddress,
            newAdmin: instruction.newAdmin,
            contract: instruction.contract
        }),
    };
    const gas = await client.simulate(senderAddress, [updateAdminContractMsg], undefined);
    const fee = await (0, exports.getCosmosTxFees)(chainSettings, Math.round(gas * GAS_MULTIPLIER).toString(10));
    const txRaw = await client.sign(senderAddress, [updateAdminContractMsg], fee, "Astrovault");
    const txBytes = tx_2.TxRaw.encode(txRaw).finish();
    const result = await client.broadcastTx(txBytes, client.broadcastTimeoutMs, client.broadcastPollIntervalMs);
    if ((0, stargate_1.isDeliverTxFailure)(result)) {
        throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    return {
        code: result.code,
        height: result.height,
        transactionHash: result.transactionHash,
        msgResponses: result.msgResponses,
        gasWanted: result.gasWanted,
        gasUsed: result.gasUsed,
    };
};
exports.updateAdminCosmosContractTx = updateAdminCosmosContractTx;
const instantiateCosmosContractTx = async (client, chainSettings, senderAddress, instruction) => {
    var _a;
    const instantiateContractMsg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgInstantiateContract",
        value: tx_1.MsgInstantiateContract.fromPartial({
            sender: senderAddress,
            codeId: BigInt(new math_1.Uint53(instruction.codeId).toString()),
            label: instruction.label,
            msg: new Buffer(JSON.stringify(instruction.msg)),
            funds: [...(instruction.funds || [])],
            admin: instruction.admin,
        }),
    };
    const gas = await client.simulate(senderAddress, [instantiateContractMsg], undefined);
    const fee = await (0, exports.getCosmosTxFees)(chainSettings, Math.round(gas * GAS_MULTIPLIER).toString(10));
    const txRaw = await client.sign(senderAddress, [instantiateContractMsg], fee, "Astrovault");
    const txBytes = tx_2.TxRaw.encode(txRaw).finish();
    const result = await client.broadcastTx(txBytes, client.broadcastTimeoutMs, client.broadcastPollIntervalMs);
    if ((0, stargate_1.isDeliverTxFailure)(result)) {
        throw new Error(createDeliverTxResponseErrorMessage(result));
    }
    const contractAddressAttr = (_a = result.events
        .find((e) => e.type === "instantiate")) === null || _a === void 0 ? void 0 : _a.attributes.find((a) => a.key === "_contract_address");
    return {
        contractAddress: contractAddressAttr.value,
        logs: [],
        height: result.height,
        transactionHash: result.transactionHash,
        events: result.events,
        gasWanted: result.gasWanted,
        gasUsed: result.gasUsed,
    };
};
exports.instantiateCosmosContractTx = instantiateCosmosContractTx;
const getCosmosTxFees = async (chainSettings, gas, useAlternativeFeeDenom = false) => {
    if (chainSettings.prefix === "archway") {
        // on archway gas is sometimes simulated wrong so we up the gas multipler abit
        gas = Math.round(parseInt(gas) * 1.2).toString(10);
        try {
            const res = await axios.default.get(chainSettings.rest +
                "/archway/rewards/v1/estimate_tx_fees?gas_limit=" +
                gas);
            return {
                amount: res.data.estimated_fee,
                gas,
                granter: undefined,
                payer: undefined,
            };
        }
        catch (error) {
            return {
                amount: (0, stargate_1.calculateFee)(Math.round(parseInt(gas) * GAS_MULTIPLIER), chainSettings.defaultFee).amount,
                gas,
                granter: undefined,
                payer: undefined,
            };
        }
    }
    if (chainSettings.prefix === "neutron") {
        try {
            const res = await axios.default.get(chainSettings.rest +
                "/feemarket/v1/gas_prices");
            const price = res.data.prices.find((priceDenom) => priceDenom.denom === (useAlternativeFeeDenom && chainSettings.alternativeFeeDenom ? chainSettings.alternativeFeeDenom :
                chainSettings.mainNativeDenom));
            const feeDenom = price.denom;
            const gasPriceAmount = price.amount;
            const feeAmount = (0, stargate_1.calculateFee)(Math.round(parseInt(gas) * GAS_MULTIPLIER), gasPriceAmount + feeDenom);
            return feeAmount;
        }
        catch (error) {
            return {
                amount: (0, stargate_1.calculateFee)(Math.round(parseInt(gas) * GAS_MULTIPLIER), chainSettings.defaultFee).amount,
                gas,
                granter: undefined,
                payer: undefined,
            };
        }
    }
    if (chainSettings.prefix === "nibi") {
        return (0, stargate_1.calculateFee)(Math.round(parseInt(gas) * GAS_MULTIPLIER), chainSettings.defaultFee);
    }
    throw new Error("Fee calculation failed, chain not supported!");
};
exports.getCosmosTxFees = getCosmosTxFees;
const getCosmosGasUnitPrice = async (chainSettings) => {
    if (chainSettings.prefix === "archway") {
        try {
            const res = await axios.default.get(chainSettings.rest + "/archway/rewards/v1/estimate_tx_fees");
            return res.data.gas_unit_price;
        }
        catch (error) {
            return (0, stargate_1.calculateFee)(Math.round(200000 * GAS_MULTIPLIER), chainSettings.defaultFee).amount[0];
        }
    }
    if (chainSettings.prefix === "neutron") {
        try {
            const res = await axios.default.get(chainSettings.rest +
                "/feemarket/v1/gas_price/" +
                chainSettings.mainNativeDenom);
            return res.data.price;
        }
        catch (error) {
            return (0, stargate_1.calculateFee)(Math.round(200000 * GAS_MULTIPLIER), chainSettings.defaultFee).amount[0];
        }
    }
    if (chainSettings.prefix === "nibi") {
        return (0, stargate_1.calculateFee)(Math.round(200000 * GAS_MULTIPLIER), chainSettings.defaultFee).amount[0];
    }
    return null;
};
exports.getCosmosGasUnitPrice = getCosmosGasUnitPrice;
function createDeliverTxResponseErrorMessage(result) {
    return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}
const createCosmWasmBatchClient = async (rpc, offlineSigner, batchClientOptions, options) => {
    const rpcClient = new tendermint_rpc_1.HttpBatchClient(rpc, batchClientOptions);
    const tmClient = await tendermint_rpc_1.Tendermint37Client.create(rpcClient);
    return cosmwasm_stargate_1.SigningCosmWasmClient.createWithSigner(tmClient, offlineSigner, options);
};
exports.createCosmWasmBatchClient = createCosmWasmBatchClient;
//# sourceMappingURL=cosmos.js.map