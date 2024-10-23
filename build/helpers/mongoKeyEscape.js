"use strict";
// MONGO DB DOES NOT SUPPORT DOTS ON THE KEY NAME
// due to the posibility of having "." dots on the key name in some places (mongo does not directly support those) we have a problem
// the only decent possibility is having an encoder that changes dots to other char that is not used on the key name (~)
// alternative: stringify the object and save it as a string on DB => NOT POSSIBLE BECAUSE MULTICHAIN CHANGES DATA IN PARALLEL, POSSIBLE LOSS OF DATA
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoKeyUnescape = exports.mongoKeyEscape = void 0;
// User on Analytics for assetsTableData and polBalances as their keys are assetIDs that can potentially have dots
const mongoKeyEscape = (key) => key.replace(".", "~");
exports.mongoKeyEscape = mongoKeyEscape;
const mongoKeyUnescape = (key) => key.replace("~", ".");
exports.mongoKeyUnescape = mongoKeyUnescape;
//# sourceMappingURL=mongoKeyEscape.js.map