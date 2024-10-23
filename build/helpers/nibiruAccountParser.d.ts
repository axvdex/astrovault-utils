import { Account, AccountParser } from "@cosmjs/stargate";
/**
 * Converts an EthAccount to a general Cosmos Account object.
 *
 * @param {EthAccount} ethAccount - The EthAccount object containing the account's base information.
 * @returns {Account} The Cosmos account object.
 */
export declare const accountFromEthAccount: ({ address, pubKey, accountNumber, sequence, }: BaseAccount) => Account;
/**
 * Parses an account input into a Cosmos account. Handles both EthAccount and other standard accounts.
 *
 * @param {Any} input - The input account information, containing the typeUrl and value.
 * @returns {Account} Parsed account object.
 */
export declare const accountFromNibiru: AccountParser;
