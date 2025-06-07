interface PreviewImage {
	blurhash: string;
	medium: string;
	small: string;
}

interface Avatar {
	previewImage: PreviewImage;
}

interface Profile {
	id: string;
	handle: string;
	avatar: Avatar;
}

interface CreatorEarningsAmount {
	currencyAddress: string;
	amountRaw: string;
	amountDecimal: number;
}

interface CreatorEarnings {
	amount: CreatorEarningsAmount;
	amountUsd: string;
}

interface PoolCurrencyToken {
	address: string;
	name: string;
	decimals: number;
}

interface MediaContent {
	mimeType: string;
	originalUri: string;
	previewImage: PreviewImage;
}

interface Transfers {
	count: number;
}

interface Coin {
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
	creatorEarnings: CreatorEarnings[];
	poolCurrencyToken: PoolCurrencyToken;
	marketCap: string;
	marketCapDelta24h: string;
	chainId: number;
	tokenUri: string;
	platformReferrerAddress: string;
	payoutRecipientAddress: string;
	creatorProfile: Profile;
	mediaContent: MediaContent;
	transfers: Transfers;
	uniqueHolders: number;
}

interface CoinBalanceNode {
	balance: string;
	id: string;
	coin: Coin;
}

interface CoinBalanceEdge {
	node: CoinBalanceNode;
}

interface PageInfo {
	hasNextPage: boolean;
	endCursor: string;
}

interface CoinBalances {
	count: number;
	edges: CoinBalanceEdge[];
	pageInfo: PageInfo;
}

interface ProfileWithCoinBalances {
	id: string;
	handle: string;
	avatar: Avatar;
	coinBalances: CoinBalances;
}

interface ResponseData {
	profile: ProfileWithCoinBalances;
}

interface CoinBalanceResponse {
	data: ResponseData;
	request: Record<string, unknown>;
	response: Record<string, unknown>;
}

// Export the main type and commonly used sub-types
export type {
	CoinBalanceResponse,
	ProfileWithCoinBalances,
	CoinBalances,
	CoinBalanceEdge,
	CoinBalanceNode,
	Coin,
	Profile,
	Avatar,
	PreviewImage,
	MediaContent,
	CreatorEarnings,
	PoolCurrencyToken,
	PageInfo,
};
