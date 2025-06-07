import type { CoinBalanceResponse } from "./types";

declare module "@zoralabs/coins-sdk" {
	export function getProfileBalances(params: {
		identifier: string;
		count?: number;
		after?: string;
	}): Promise<CoinBalanceResponse>;
}
