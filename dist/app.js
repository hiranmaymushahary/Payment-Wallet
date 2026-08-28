"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const wallet_routes_1 = __importDefault(require("./api-gateway/routes/wallet-routes"));
const transaction_routes_1 = __importDefault(require("./api-gateway/routes/transaction-routes"));
const error_handler_1 = require("./shared/middleware/error-handler");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', time: new Date().toISOString() });
    });
    app.use('/api/wallets', wallet_routes_1.default);
    app.use('/api/transactions', transaction_routes_1.default);
    app.use(error_handler_1.errorHandler);
    return app;
}
;
//# sourceMappingURL=app.js.map