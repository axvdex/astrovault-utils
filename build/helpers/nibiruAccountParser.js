"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountFromNibiru = exports.accountFromEthAccount = void 0;
// @ts-nocheck
const proto_signing_1 = require("@cosmjs/proto-signing");
const stargate_1 = require("@cosmjs/stargate");
const EthAccount = require("@nibiruchain/nibijs/dist/src/protojs/eth/types/v1/account").EthAccount;
const Any = require("@nibiruchain/nibijs/dist/src/protojs/google/protobuf/any").Any;
const BaseAccount = require("@nibiruchain/nibijs/dist/src/protojs/cosmos/auth/v1beta1/auth").BaseAccount;
const utils_1 = require("@cosmjs/utils");
/**
 * Converts an EthAccount to a general Cosmos Account object.
 *
 * @param {EthAccount} ethAccount - The EthAccount object containing the account's base information.
 * @returns {Account} The Cosmos account object.
 */
const accountFromEthAccount = ({ address, pubKey, accountNumber, sequence, }) => ({
    address,
    pubkey: (0, proto_signing_1.decodeOptionalPubkey)(pubKey),
    accountNumber: accountNumber.toNumber(),
    sequence: sequence.toNumber(),
});
exports.accountFromEthAccount = accountFromEthAccount;
/**
 * Parses an account input into a Cosmos account. Handles both EthAccount and other standard accounts.
 *
 * @param {Any} input - The input account information, containing the typeUrl and value.
 * @returns {Account} Parsed account object.
 */
const accountFromNibiru = (input) => {
    const { typeUrl, value } = input;
    if (typeUrl === "/eth.types.v1.EthAccount") {
        const baseAccount = EthAccount.decode(value).baseAccount;
        (0, utils_1.assert)(baseAccount);
        return (0, exports.accountFromEthAccount)(baseAccount);
    }
    return (0, stargate_1.accountFromAny)(input);
};
exports.accountFromNibiru = accountFromNibiru;
//# sourceMappingURL=nibiruAccountParser.js.map