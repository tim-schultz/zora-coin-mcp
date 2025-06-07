#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./zora-mcp.js";

async function main() {
	// Get environment variables
	const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
	const rpcUrl = process.env.RPC_URL;

	if (!privateKey) {
		console.error("PRIVATE_KEY environment variable is required");
		process.exit(1);
	}

	if (!rpcUrl) {
		console.error("RPC_URL environment variable is required");
		process.exit(1);
	}

	try {
		const { server } = createServer(privateKey, rpcUrl);
		const transport = new StdioServerTransport();
		await server.connect(transport);
	} catch (error) {
		console.error("Failed to start MCP server:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main().catch((error) => {
		console.error("Unhandled error:", error);
		process.exit(1);
	});
}
