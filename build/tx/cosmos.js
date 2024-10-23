"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCosmosGasUnitPrice = exports.getCosmosTxFees = exports.instantiateCosmosContractTx = exports.executeCosmosContractTx = void 0;
const axios = require("axios");
const stargate_1 = require("@cosmjs/stargate");
const tx_1 = require("cosmjs-types/cosmwasm/wasm/v1/tx");
const tx_2 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const math_1 = require("@cosmjs/math");
// Functions other than the instantiate and execute function, use the respective client and query the getCosmosTxFees when necessary
const GAS_MULTIPLIER = 1.2;
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
    let fee = await (0, exports.getCosmosTxFees)(chainSettings, Math.round(gas * GAS_MULTIPLIER).toString(10));
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
const getCosmosTxFees = async (chainSettings, gas) => {
    if (chainSettings.prefix === "archway") {
        const res = await axios.get(chainSettings.rest +
            "/archway/rewards/v1/estimate_tx_fees?gas_limit=" +
            gas);
        return {
            amount: res.data.estimated_fee,
            gas,
            granter: undefined,
            payer: undefined,
        };
    }
    if (chainSettings.prefix === "neutron") {
        const res = await axios.get(chainSettings.rest +
            "/feemarket/v1/gas_price/" +
            chainSettings.mainNativeDenom);
        const feeDenom = res.data.price.denom;
        const gasPriceAmount = res.data.price.amount;
        const feeAmount = (0, stargate_1.calculateFee)(Math.round(parseInt(gas) * GAS_MULTIPLIER), gasPriceAmount + feeDenom);
        return feeAmount;
    }
    throw new Error("Fee calculation failed, chain not supported!");
};
exports.getCosmosTxFees = getCosmosTxFees;
const getCosmosGasUnitPrice = async (chainSettings) => {
    if (chainSettings.prefix === "archway") {
        const res = await axios.get(chainSettings.rest + "/archway/rewards/v1/estimate_tx_fees");
        return res.data.gas_unit_price;
    }
    if (chainSettings.prefix === "neutron") {
        const res = await axios.get(chainSettings.rest +
            "/feemarket/v1/gas_price/" +
            chainSettings.mainNativeDenom);
        return res.data.price;
    }
    return null;
};
exports.getCosmosGasUnitPrice = getCosmosGasUnitPrice;
function createDeliverTxResponseErrorMessage(result) {
    return `Error when broadcasting tx ${result.transactionHash} at height ${result.height}. Code: ${result.code}; Raw log: ${result.rawLog}`;
}
//# sourceMappingURL=cosmos.js.map