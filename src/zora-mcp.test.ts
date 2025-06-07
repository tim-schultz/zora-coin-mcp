import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import {
	createCoin,
	getOnchainCoinDetails,
	tradeCoin,
} from "@zoralabs/coins-sdk";
import { getAddress, parseEther } from "viem";
import { beforeEach, describe, expect, it, test } from "vitest";
import { vi } from "vitest";
import { z } from "zod";
import { getProfileBalancesZora } from "./blockchain/zora";
import { createServer } from "./zora-mcp";

describe("MCP Server E2E Tests", () => {
	let mcpServer: ReturnType<typeof createServer>;
	let client: Client;
	let clientTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[0];
	let serverTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[1];

	beforeEach(async () => {
		vi.clearAllMocks();
		const { server: mcpServer } = createServer(
			process.env.PRIVATE_KEY as `0x${string}`,
			process.env.RPC_URL as string,
		);

		client = new Client({ name: "test client", version: "1.0" });
		[clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

		await Promise.all([
			mcpServer.server.connect(serverTransport),
			client.connect(clientTransport),
		]);
	});

	test("tools/list returns all tools", async () => {
		const res = await client.request(
			{ method: "tools/list", params: {} },
			ListToolsResultSchema,
		);
		expect(Array.isArray(res.tools)).toBe(true);
	});

	const recipient = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

	describe("createCoin tool", () => {
		const validInput = {
			name: "My Awesome Coin",
			symbol: "MAC",
			uri: "ipfs://bafybeigoxzqzbnxsn35vq7lls3ljxdcwjafxvbvkivprsodzrptpiguysy",
			payoutRecipient: recipient,
			platformReferrer: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			currency: 1,
		} as const;

		it("happy path: returns hash and address", async () => {
			const res = await client.request(
				{
					method: "tools/call",
					params: { name: "createCoin", arguments: validInput },
				},
				z.object({
					content: z.array(
						z.object({ type: z.literal("text"), text: z.string() }),
					),
				}),
			);
			expect(res.content[0].text).toContain("Hash: 0x");
			expect(res.content[0].text).toContain("Address: 0x");
		});
	});

	describe("tradeCoin tool (real requests)", () => {
		type CoinBalanceEdge = {
			node: {
				balance: string;
				id: string;
				coin: {
					id: string;
					name: string;
					description: string;
					address: string;
					symbol: string;
					totalSupply: string;
					totalVolume: string;
					volume24h: string;
					createdAt: string;
					creatorAddress: string;
					creatorEarnings: unknown[];
					poolCurrencyToken: {
						address: string;
						name: string;
						decimals: number;
					};
					marketCap: string;
					marketCapDelta24h: string;
					chainId: number;
					tokenUri: string;
					platformReferrerAddress: string;
					payoutRecipientAddress: string;
					creatorProfile: {
						id: string;
						handle: string;
						avatar: {
							previewImage: { blurhash: string; medium: string; small: string };
						};
					};
					mediaContent: {
						mimeType: string;
						originalUri: string;
						previewImage: { blurhash: string; medium: string; small: string };
					};
					transfers: { count: number };
					uniqueHolders: number;
				};
			};
		};

		type ProfileBalancesResponse = {
			data: {
				profile: {
					id: string;
					handle: string;
					avatar: {
						previewImage: { blurhash: string; medium: string; small: string };
					};
					coinBalances: {
						count: number;
						edges: CoinBalanceEdge[];
						pageInfo: { hasNextPage: boolean; endCursor: string };
					};
				};
			};
		};

		it("should fetch balances for 'jessepollak' and make a trade with a real token", async () => {
			// Fetch balances for 'jessepollak'
			const balancesRes = await client.request(
				{
					method: "tools/call",
					params: {
						name: "getProfileBalances",
						arguments: {
							identifier: "0x849151d7D0bF1F34b70d5caD5149D28CC2308bf1",
							count: 1,
						},
					},
				},
				z.object({
					content: z.array(
						z.object({ type: z.literal("text"), text: z.string() }),
					),
				}),
			);

			const text = balancesRes.content[0].text;
			// Try to parse the JSON from the text
			const match = text.match(/\{[\s\S]*\}/);
			if (!match) throw new Error("No JSON found in profile balances response");
			const balances = JSON.parse(match[0]) as ProfileBalancesResponse;

			// Find a token to trade
			const coinEdges = balances.data.profile.coinBalances.edges;
			if (coinEdges.length === 0)
				throw new Error("No tokens found for jessepollak");
			const coin = coinEdges[0].node.coin;
			const coinAddress: string = coin.address;
			const handle: string = balances.data.profile.handle;
			expect(coinAddress).toContain("0x");
			expect(handle).toBe("jessepollak");

			const checkSumAddress = getAddress(coinAddress);
			// Make a trade (buy 1 unit)
			const tradeInput = {
				direction: "buy" as const,
				target: checkSumAddress,
				args: {
					recipient,
					orderSize: "0.1",
				},
			};

			const tradeRes = await client.request(
				{
					method: "tools/call",
					params: { name: "tradeCoin", arguments: tradeInput },
				},
				z.object({
					content: z.array(
						z.object({ type: z.literal("text"), text: z.string() }),
					),
				}),
			);

			expect(tradeRes.content[0].text).toContain("Trade executed!");
			expect(tradeRes.content[0].text).toContain("Hash: 0x");
		});
	});

	// describe("fetchCoinDetails tool", () => {
	// 	const validInput = {
	// 		coinAddress: "0x81bd27a4b4e11a0a80dbf95f0323463e9858687c",
	// 		// userAddress: "0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1",
	// 	} as const;

	// 	it("happy path: returns coin details", async () => {
	// 		const res = await client.request(
	// 			{
	// 				method: "tools/call",
	// 				params: { name: "fetchCoinDetails", arguments: validInput },
	// 			},
	// 			z.object({
	// 				content: z.array(
	// 					z.object({ type: z.literal("text"), text: z.string() }),
	// 				),
	// 			}),
	// 		);
	// 		expect(res.content[0].text).toContain("Coin Details:");
	// 		expect(res.content[0].text).toContain("Market Cap: ETH 1");
	// 		expect(res.content[0].text).toContain("Liquidity: ETH 2");
	// 		expect(res.content[0].text).toContain("User Balance: 10");
	// 	});
	// });

	// describe("getProfileBalances tool", () => {
	// 	const validInput = {
	// 		identifier: "0x849151d7d0bf1f34b70d5cad5149d28cc2308bf1",
	// 		count: 2,
	// 		after: undefined,
	// 	} as const;

	// 	it("happy path: returns profile balances", async () => {
	// 		const res = await client.request(
	// 			{
	// 				method: "tools/call",
	// 				params: { name: "getProfileBalances", arguments: validInput },
	// 			},
	// 			z.object({
	// 				content: z.array(
	// 					z.object({ type: z.literal("text"), text: z.string() }),
	// 				),
	// 			}),
	// 		);
	// 		expect(res.content[0].text).toContain("Profile Balances for testuser");
	// 		expect(res.content[0].text).toContain("coin1");
	// 		expect(res.content[0].text).toContain("coin2");
	// 	});
	// });
});
