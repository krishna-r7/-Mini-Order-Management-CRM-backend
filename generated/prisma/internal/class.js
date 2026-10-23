"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClientClass = getPrismaClientClass;
const runtime = __importStar(require("@prisma/client/runtime/client"));
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.1",
    "engineVersion": "d1b3f377ca835d73fd50954a5e22128b9ebdd6b8",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider = \"prisma-client\"\n  output   = \"../generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nmodel Order {\n  id                String    @id @default(cuid())\n  shopifyOrderId    String    @unique\n  orderNumber       String\n  email             String?\n  customerName      String?\n  totalPrice        Decimal   @db.Decimal(12, 2)\n  currency          String    @default(\"USD\")\n  financialStatus   String?\n  fulfillmentStatus String?\n  shopifyCreatedAt  DateTime?\n  shopifyUpdatedAt  DateTime?\n  createdAt         DateTime  @default(now())\n  updatedAt         DateTime  @updatedAt\n\n  @@index([orderNumber])\n  @@index([email])\n  @@index([shopifyCreatedAt])\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"Order\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"shopifyOrderId\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"orderNumber\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"customerName\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"totalPrice\",\"kind\":\"scalar\",\"type\":\"Decimal\"},{\"name\":\"currency\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"financialStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"fulfillmentStatus\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"shopifyCreatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"shopifyUpdatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"Order.findUnique\",\"Order.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"Order.findFirst\",\"Order.findFirstOrThrow\",\"Order.findMany\",\"data\",\"Order.createOne\",\"Order.createMany\",\"Order.createManyAndReturn\",\"Order.updateOne\",\"Order.updateMany\",\"Order.updateManyAndReturn\",\"create\",\"update\",\"Order.upsertOne\",\"Order.deleteOne\",\"Order.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"Order.groupBy\",\"Order.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"shopifyOrderId\",\"orderNumber\",\"email\",\"customerName\",\"totalPrice\",\"currency\",\"financialStatus\",\"fulfillmentStatus\",\"shopifyCreatedAt\",\"shopifyUpdatedAt\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "PAsQEBwAACwAMB0AAAQAEB4AACwAMB8BAAAAASABAAAAASEBAC0AISIBAC4AISMBAC4AISQQAC8AISUBAC0AISYBAC4AIScBAC4AIShAADAAISlAADAAISpAADEAIStAADEAIQEAAAABACABAAAAAQAgEBwAACwAMB0AAAQAEB4AACwAMB8BAC0AISABAC0AISEBAC0AISIBAC4AISMBAC4AISQQAC8AISUBAC0AISYBAC4AIScBAC4AIShAADAAISlAADAAISpAADEAIStAADEAIQYiAAAyACAjAAAyACAmAAAyACAnAAAyACAoAAAyACApAAAyACADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACANHwEAAAABIAEAAAABIQEAAAABIgEAAAABIwEAAAABJBAAAAABJQEAAAABJgEAAAABJwEAAAABKEAAAAABKUAAAAABKkAAAAABK0AAAAABAQgAAAkAIA0fAQAAAAEgAQAAAAEhAQAAAAEiAQAAAAEjAQAAAAEkEAAAAAElAQAAAAEmAQAAAAEnAQAAAAEoQAAAAAEpQAAAAAEqQAAAAAErQAAAAAEBCAAACwAwAQgAAAsAMA0fAQA4ACEgAQA4ACEhAQA4ACEiAQA5ACEjAQA5ACEkEAA6ACElAQA4ACEmAQA5ACEnAQA5ACEoQAA7ACEpQAA7ACEqQAA8ACErQAA8ACECAAAAAQAgCAAADgAgDR8BADgAISABADgAISEBADgAISIBADkAISMBADkAISQQADoAISUBADgAISYBADkAIScBADkAIShAADsAISlAADsAISpAADwAIStAADwAIQIAAAAEACAIAAAQACACAAAABAAgCAAAEAAgAwAAAAEAIA8AAAkAIBAAAA4AIAEAAAABACABAAAABAAgCxUAADMAIBYAADQAIBcAADcAIBgAADYAIBkAADUAICIAADIAICMAADIAICYAADIAICcAADIAICgAADIAICkAADIAIBAcAAAaADAdAAAXABAeAAAaADAfAQAbACEgAQAbACEhAQAbACEiAQAcACEjAQAcACEkEAAdACElAQAbACEmAQAcACEnAQAcACEoQAAeACEpQAAeACEqQAAfACErQAAfACEDAAAABAAgAwAAFgAwFAAAFwAgAwAAAAQAIAMAAAUAMAQAAAEAIBAcAAAaADAdAAAXABAeAAAaADAfAQAbACEgAQAbACEhAQAbACEiAQAcACEjAQAcACEkEAAdACElAQAbACEmAQAcACEnAQAcACEoQAAeACEpQAAeACEqQAAfACErQAAfACEOFQAAIQAgGAAAKwAgGQAAKwAgLAEAAAABLQEAAAAELgEAAAAELwEAAAABMAEAAAABMQEAAAABMgEAAAABMwEAKgAhNAEAAAABNQEAAAABNgEAAAABDhUAACQAIBgAACkAIBkAACkAICwBAAAAAS0BAAAABS4BAAAABS8BAAAAATABAAAAATEBAAAAATIBAAAAATMBACgAITQBAAAAATUBAAAAATYBAAAAAQ0VAAAhACAWAAAnACAXAAAnACAYAAAnACAZAAAnACAsEAAAAAEtEAAAAAQuEAAAAAQvEAAAAAEwEAAAAAExEAAAAAEyEAAAAAEzEAAmACELFQAAJAAgGAAAJQAgGQAAJQAgLEAAAAABLUAAAAAFLkAAAAAFL0AAAAABMEAAAAABMUAAAAABMkAAAAABM0AAIwAhCxUAACEAIBgAACIAIBkAACIAICxAAAAAAS1AAAAABC5AAAAABC9AAAAAATBAAAAAATFAAAAAATJAAAAAATNAACAAIQsVAAAhACAYAAAiACAZAAAiACAsQAAAAAEtQAAAAAQuQAAAAAQvQAAAAAEwQAAAAAExQAAAAAEyQAAAAAEzQAAgACEILAIAAAABLQIAAAAELgIAAAAELwIAAAABMAIAAAABMQIAAAABMgIAAAABMwIAIQAhCCxAAAAAAS1AAAAABC5AAAAABC9AAAAAATBAAAAAATFAAAAAATJAAAAAATNAACIAIQsVAAAkACAYAAAlACAZAAAlACAsQAAAAAEtQAAAAAUuQAAAAAUvQAAAAAEwQAAAAAExQAAAAAEyQAAAAAEzQAAjACEILAIAAAABLQIAAAAFLgIAAAAFLwIAAAABMAIAAAABMQIAAAABMgIAAAABMwIAJAAhCCxAAAAAAS1AAAAABS5AAAAABS9AAAAAATBAAAAAATFAAAAAATJAAAAAATNAACUAIQ0VAAAhACAWAAAnACAXAAAnACAYAAAnACAZAAAnACAsEAAAAAEtEAAAAAQuEAAAAAQvEAAAAAEwEAAAAAExEAAAAAEyEAAAAAEzEAAmACEILBAAAAABLRAAAAAELhAAAAAELxAAAAABMBAAAAABMRAAAAABMhAAAAABMxAAJwAhDhUAACQAIBgAACkAIBkAACkAICwBAAAAAS0BAAAABS4BAAAABS8BAAAAATABAAAAATEBAAAAATIBAAAAATMBACgAITQBAAAAATUBAAAAATYBAAAAAQssAQAAAAEtAQAAAAUuAQAAAAUvAQAAAAEwAQAAAAExAQAAAAEyAQAAAAEzAQApACE0AQAAAAE1AQAAAAE2AQAAAAEOFQAAIQAgGAAAKwAgGQAAKwAgLAEAAAABLQEAAAAELgEAAAAELwEAAAABMAEAAAABMQEAAAABMgEAAAABMwEAKgAhNAEAAAABNQEAAAABNgEAAAABCywBAAAAAS0BAAAABC4BAAAABC8BAAAAATABAAAAATEBAAAAATIBAAAAATMBACsAITQBAAAAATUBAAAAATYBAAAAARAcAAAsADAdAAAEABAeAAAsADAfAQAtACEgAQAtACEhAQAtACEiAQAuACEjAQAuACEkEAAvACElAQAtACEmAQAuACEnAQAuACEoQAAwACEpQAAwACEqQAAxACErQAAxACELLAEAAAABLQEAAAAELgEAAAAELwEAAAABMAEAAAABMQEAAAABMgEAAAABMwEAKwAhNAEAAAABNQEAAAABNgEAAAABCywBAAAAAS0BAAAABS4BAAAABS8BAAAAATABAAAAATEBAAAAATIBAAAAATMBACkAITQBAAAAATUBAAAAATYBAAAAAQgsEAAAAAEtEAAAAAQuEAAAAAQvEAAAAAEwEAAAAAExEAAAAAEyEAAAAAEzEAAnACEILEAAAAABLUAAAAAFLkAAAAAFL0AAAAABMEAAAAABMUAAAAABMkAAAAABM0AAJQAhCCxAAAAAAS1AAAAABC5AAAAABC9AAAAAATBAAAAAATFAAAAAATJAAAAAATNAACIAIQAAAAAAAAE3AQAAAAEBNwEAAAABBTcQAAAAATgQAAAAATkQAAAAAToQAAAAATsQAAAAAQE3QAAAAAEBN0AAAAABAAAAAAUVAAYWAAcXAAgYAAkZAAoAAAAAAAUVAAYWAAcXAAgYAAkZAAoBAgECAwEFBgEGBwEHCAEJCgEKDAILDQMMDwENEQIOEgQREwESFAETFQIaGAUbGQs"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.js"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map