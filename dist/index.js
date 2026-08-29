"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
const prisma_client_1 = require("./shared/database/prisma-client");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const app = (0, app_1.createApp)();
//Intialise prisma clients
async function initializeDatabase() {
    try {
        (0, prisma_client_1.getShard1Client)();
        (0, prisma_client_1.getShard2Client)();
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1);
    }
}
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received');
    await (0, prisma_client_1.closePrismaClients)();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('SIGINT signal received');
    await (0, prisma_client_1.closePrismaClients)();
    process.exit(0);
});
//# sourceMappingURL=index.js.map