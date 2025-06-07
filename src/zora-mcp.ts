import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	DeployCurrency,
	type OnchainCoinDetails,
	type TradeParams,
	createCoin,
	getOnchainCoinDetails,
	// @ts-ignore
	getProfileBalances,
	tradeCoin,
} from "@zoralabs/coins-sdk";
//  NAVA PK 934d7f48b44af8e0d336981999d2bd1e4f94ff450f2f97f785fd600b0bc49685
import {
	http,
	type Address,
	type BaseError,
	type Hex,
	type WalletClient,
	createPublicClient,
	createTestClient,
	createWalletClient,
	parseEther,
	publicActions,
	walletActions,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import { base, foundry } from "viem/chains";
import { z } from "zod";
import { getProfileBalancesZora } from "./blockchain/zora";

const createCoinSchema = z.object({
	name: z.string().min(1),
	symbol: z.string().min(1),
	uri: z.string().min(1),
	chainId: z.number().optional(),
	owners: z.array(z.string()).optional(),
	payoutRecipient: z.string().min(1),
	platformReferrer: z.string().optional(),
	currency: z.union([z.literal(1), z.literal(2)]).optional(),
});

const tradeCoinSchema = z.object({
	direction: z.enum(["buy", "sell"]),
	target: z.string().min(1),
	args: z.object({
		recipient: z.string().min(1),
		orderSize: z.string().min(1),
		minAmountOut: z.bigint().optional(),
		tradeReferrer: z.string().optional(),
	}),
});

type TradeCoinInput = z.infer<typeof tradeCoinSchema>;

type TradeCoinResponse = {
	hash: Hex;
	trade: unknown;
};

const getTopCoinsSchema = z.object({
	count: z.number().optional(),
	after: z.string().optional(),
});

const fetchCoinDetailsSchema = z.object({
	coinAddress: z.string().min(1),
	userAddress: z.string().optional(),
});

type FetchCoinDetailsInput = z.infer<typeof fetchCoinDetailsSchema>;

const getProfileBalancesSchema = z.object({
	identifier: z.string().min(1), // address or handle
	count: z.number().optional(),
	after: z.string().optional(),
});

type GetProfileBalancesInput = z.infer<typeof getProfileBalancesSchema>;

/*
Core Functionality
- Create a coin
- Trade a coin
- Get the details of a coin
*/
export function createServer(
	privateKey?: `0x${string}`,
	rpcUrl?: string,
): { server: McpServer } {
	if (!privateKey) {
		throw new Error("PRIVATE_KEY is not set");
	}
	if (!/^0x[0-9a-fA-F]+$/.test(privateKey)) {
		throw new Error("PRIVATE_KEY must be a hex string starting with 0x");
	}
	if (!rpcUrl) {
		throw new Error("RPC_URL is not set");
	}

	const account = privateKeyToAccount(privateKey);
	const walletClient: WalletClient = createWalletClient({
		chain: base,
		transport: http(rpcUrl),
		account,
	});

	const publicClient = createPublicClient({
		chain: base,
		transport: http(rpcUrl),
	});

	const server = new McpServer({
		name: "zora-coin-mcp",
		version: "1.0.0",
	});

	// --- createCoin ---
	const createCoinOutputSchema = z.object({
		hash: z.string().describe("Transaction hash"),
		address: z
			.string()
			.nullable()
			.describe("Deployed coin address or null if pending"),
	});
	server.registerTool(
		"createCoin",
		{
			description:
				"Create a new zora coin. Use this tool to deploy a new coin to the zora network.",
			inputSchema: createCoinSchema.shape,
			outputSchema: createCoinOutputSchema.shape,
		},
		async (input: z.infer<typeof createCoinSchema>) => {
			try {
				const args = {
					name: input.name,
					symbol: input.symbol,
					uri: input.uri,
					chainId: input.chainId ?? 8453, // default to Base mainnet
					owners: input.owners as Address[] | undefined,
					payoutRecipient: input.payoutRecipient as Address,
					platformReferrer: input.platformReferrer as Address | undefined,
					currency: input.currency,
				};
				const result = await createCoin(args, walletClient, publicClient);
				const structuredContent = {
					hash: result.hash,
					address: result.address ?? null,
				};
				return {
					content: [
						{
							type: "text" as const,
							text: `Hash: ${result.hash}\nAddress: ${result.address ?? "pending..."}`,
						},
					],
					structuredContent,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error creating coin: ${error}`,
						},
					],
				};
			}
		},
	);

	// --- tradeCoin ---
	const tradeCoinOutputSchema = z.object({
		hash: z.string().describe("Transaction hash"),
		trade: z.unknown().describe("Trade details object"),
	});
	server.registerTool(
		"tradeCoin",
		{
			description:
				"Use this tool to buy or sell a given zora coin. If you are not sure what details to provide, use the fetchCoinDetails tool to get the details of the coin.",
			inputSchema: tradeCoinSchema.shape,
			outputSchema: tradeCoinOutputSchema.shape,
		},
		async (input: TradeCoinInput) => {
			try {
				const params = {
					direction: input.direction,
					target: input.target as Address,
					args: {
						recipient: input.args.recipient as Address,
						orderSize: parseEther(input.args.orderSize),
						minAmountOut: input.args.minAmountOut,
						tradeReferrer: input.args.tradeReferrer as Address | undefined,
					},
				} as TradeParams;
				const result = await tradeCoin(params, walletClient, publicClient);
				const structuredContent = {
					hash: result.hash,
				};
				const text = `Trade executed!\nHash: ${result.hash}`;
				return {
					content: [
						{
							type: "text" as const,
							text,
						},
					],
					structuredContent,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error trading coin: ${error}`,
						},
					],
				};
			}
		},
	);

	// --- fetchCoinDetails ---
	const fetchCoinDetailsOutputSchema = z.object({
		marketCap: z.object({ eth: z.string() }),
		liquidity: z.object({ eth: z.string() }),
		pool: z.string(),
		owners: z.array(z.string()),
		payoutRecipient: z.string(),
		balance: z.string().optional(),
	});
	server.registerTool(
		"fetchCoinDetails",
		{
			description:
				"Fetch the details of a given zora coin. Useful for finding metadata about a coin.",
			inputSchema: fetchCoinDetailsSchema.shape,
			outputSchema: fetchCoinDetailsOutputSchema.shape,
		},
		async (input: FetchCoinDetailsInput) => {
			try {
				const details: OnchainCoinDetails = await getOnchainCoinDetails({
					coin: input.coinAddress as Address,
					user: input.userAddress as Address | undefined,
					publicClient,
				});
				const structuredContent = {
					marketCap: { eth: details.marketCap.eth.toString() },
					liquidity: { eth: details.liquidity.eth.toString() },
					pool: details.pool,
					owners: details.owners,
					payoutRecipient: details.payoutRecipient,
					...(details.balance ? { balance: details.balance.toString() } : {}),
				};
				const text = `Coin Details:\nMarket Cap: ETH ${details.marketCap.eth.toString()}\nLiquidity: ETH ${details.liquidity.eth.toString()}\nPool Address: ${details.pool}\nOwners: ${details.owners.join(", ")}\nPayout Recipient: ${details.payoutRecipient}\n${details.balance ? `User Balance: ${details.balance.toString()}\n` : ""}`;
				return {
					content: [
						{
							type: "text" as const,
							text,
						},
					],
					structuredContent,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error fetching coin details: ${error}`,
						},
					],
				};
			}
		},
	);

	// --- getProfileBalances ---
	const getProfileBalancesOutputSchema = z.object({
		profileBalances: z.unknown(), // You may want to define a stricter schema if you know the structure
	});
	server.registerTool(
		"getProfileBalances",
		{
			description: "Get the tokens owned by a given address or handle",
			inputSchema: getProfileBalancesSchema.shape,
			outputSchema: getProfileBalancesOutputSchema.shape,
		},
		async (input: GetProfileBalancesInput) => {
			try {
				const result = await getProfileBalancesZora({
					identifier: input.identifier,
					count: input.count,
					after: input.after,
				});
				const structuredContent = { profileBalances: result };
				return {
					content: [
						{
							type: "text" as const,
							text: `Profile Balances for ${input.identifier}:\n${JSON.stringify(result, null, 2)}`,
						},
					],
					structuredContent,
				};
			} catch (error) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Error fetching profile balances: ${error}`,
						},
					],
				};
			}
		},
	);

	return { server };
}
