"use strict";
// Generic enough to be used by ALL contract executions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCosmosGasUnitPrice = exports.getCosmosTxFees = exports.instantiateCosmosContractTx = exports.executeCosmosContractTx = void 0;
var cosmos_1 = require("./tx/cosmos");
Object.defineProperty(exports, "executeCosmosContractTx", { enumerable: true, get: function () { return cosmos_1.executeCosmosContractTx; } });
Object.defineProperty(exports, "instantiateCosmosContractTx", { enumerable: true, get: function () { return cosmos_1.instantiateCosmosContractTx; } });
Object.defineProperty(exports, "getCosmosTxFees", { enumerable: true, get: function () { return cosmos_1.getCosmosTxFees; } });
Object.defineProperty(exports, "getCosmosGasUnitPrice", { enumerable: true, get: function () { return cosmos_1.getCosmosGasUnitPrice; } });
__exportStar(require("./interfaces/global"), exports);
//# sourceMappingURL=index.js.map