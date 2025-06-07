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
import type { CreateCoinArgs } from "@zoralabs/coins-sdk";
import type { Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { CoinBalanceResponse } from "../types";

const account = privateKeyToAccount(
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);

export type GetProfileBalancesZoraParams = {
	identifier: string;
	count?: number;
	after?: string;
};

export async function getProfileBalancesZora(
	params: GetProfileBalancesZoraParams,
): Promise<unknown> {
	const { identifier, count, after } = params;
	const response = (await getProfileBalances({
		identifier,
		count,
		after,
	})) as unknown as CoinBalanceResponse;

	const profile = response?.data?.profile;

	return response;
}
