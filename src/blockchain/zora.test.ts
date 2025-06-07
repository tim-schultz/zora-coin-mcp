import type { CreateCoinArgs, TradeParams } from "@zoralabs/coins-sdk";
import { DeployCurrency } from "@zoralabs/coins-sdk";
import {
	type Mock,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { getProfileBalancesZora } from "./zora";

vi.mock("@zoralabs/coins-sdk", async (importOriginal) => {
	const actual = (await importOriginal()) as Record<string, unknown>;
	return {
		...actual,
		getProfileBalances: vi.fn(),
	};
});

import { createCoin, getProfileBalances, tradeCoin } from "@zoralabs/coins-sdk";

describe("zora.ts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getProfileBalancesZora", () => {
		it("should return response and log balances when coinBalances exist", async () => {
			const mockResponse = {
				data: {
					profile: {
						coinBalances: [
							{ id: "1", amount: "100" },
							{ id: "2", amount: "200" },
						],
					},
				},
			} as const;
			(getProfileBalances as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockResponse,
			);
			const params = { identifier: "testuser" };
			const result = await getProfileBalancesZora(params);
			expect(getProfileBalances).toHaveBeenCalledWith(params);
			expect(result).toStrictEqual(mockResponse);
		});

		it("should return response and log zero balances when coinBalances is empty", async () => {
			const mockResponse = {
				data: {
					profile: {
						coinBalances: [],
					},
				},
			} as const;
			(getProfileBalances as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
				mockResponse,
			);
			const params = { identifier: "testuser" };
			const result = await getProfileBalancesZora(params);
			expect(getProfileBalances).toHaveBeenCalledWith(params);
			expect(result).toStrictEqual(mockResponse);
		});

		it("should throw if getProfileBalances throws", async () => {
			(getProfileBalances as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("fail"),
			);
			const params = { identifier: "testuser" };
			await expect(getProfileBalancesZora(params)).rejects.toThrow("fail");
		});
	});
});
