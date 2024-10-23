// MONGO DB DOES NOT SUPPORT DOTS ON THE KEY NAME
// due to the posibility of having "." dots on the key name in some places (mongo does not directly support those) we have a problem
// the only decent possibility is having an encoder that changes dots to other char that is not used on the key name (~)
// alternative: stringify the object and save it as a string on DB => NOT POSSIBLE BECAUSE MULTICHAIN CHANGES DATA IN PARALLEL, POSSIBLE LOSS OF DATA

// User on Analytics for assetsTableData and polBalances as their keys are assetIDs that can potentially have dots
export const mongoKeyEscape = (key: string): string => key.replace(".", "~");
export const mongoKeyUnescape = (key: string): string => key.replace("~", ".");
