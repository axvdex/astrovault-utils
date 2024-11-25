import {
    fromBase64,
    toBech32,
} from "@cosmjs/encoding";
import {
    ripemd160,
    sha256,
} from "@cosmjs/crypto";
import { chains } from 'chain-registry';
const axios = require("axios");

/// Get an account on a specific chain, fetch its pubkey and derive the wallet address from it on a target chain.
export const accountToWalletAddress = async (srcChainID: string, address: string, destChainID: string) => {
    const srcChain = chains.find(({ chain_id }) => chain_id === srcChainID);
    let accData;
    for (const api of srcChain.apis.rest) {
        try {
            accData = await axios.default.get(`${api.address}/cosmos/auth/v1beta1/accounts/${address}`);
            break;
        } catch (error) {
            continue;
        }
    }
    if (!accData) {
        throw new Error(`Account ${address} not found on ${srcChainID}`);
    }
    const accPubKey = accData.data.account.pub_key;
    const dstChain = chains.find(({ chain_id }) => chain_id === destChainID);
    const pubKeyBytes = fromBase64(accPubKey!.key);
    const pubKeySha256Hash = sha256(pubKeyBytes);
    const addressBytes = ripemd160(pubKeySha256Hash);
    const dstAddress = toBech32(dstChain.bech32_prefix, addressBytes);

    console.log(`Account ${address} on ${srcChainID} has wallet address ${dstAddress} on ${destChainID}`);
    return dstAddress;
};