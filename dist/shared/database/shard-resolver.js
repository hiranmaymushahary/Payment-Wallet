"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShardResolver = void 0;
const shared_types_1 = require("../types/shared-types");
class ShardResolver {
    static getShardId(userId) {
        const userIdNum = typeof userId === 'bigint' ? Number(userId) : userId;
        const shardId = (userIdNum % 2) == 0 ? shared_types_1.ShardId.SHARD_1 : shared_types_1.ShardId.SHARD_2;
        return shardId;
    }
    static getShardName(userId) {
        const shardId = this.getShardId(userId);
        return shardId == shared_types_1.ShardId.SHARD_1 ? 'shard_1' : 'shard_2';
    }
    static areOnSameShard(userId1, userId2) {
        return this.getShardId(userId1) == this.getShardId(userId2);
    }
}
exports.ShardResolver = ShardResolver;
//# sourceMappingURL=shard-resolver.js.map