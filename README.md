# Zora Coin MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with tools to interact with Zora coins on the Base blockchain. This server enables creating, trading, and querying Zora coins through a standardized MCP interface.

## Overview

This MCP server exposes four main tools:
- **createCoin**: Deploy new Zora content coins to the Base network
- **tradeCoin**: Buy or sell existing Zora coins
- **fetchCoinDetails**: Get detailed metadata about a specific coin
- **getProfileBalances**: Retrieve token balances for a given address or handle

## Setup

### Prerequisites

1. **Install Forge Anvil** (required for local testing)
   ```bash
   curl -L https://foundry.sh | bash
   foundryup
   ```
   For detailed installation instructions, visit: https://getfoundry.sh/introduction/installation

2. **Node.js** (v18 or higher)
3. **pnpm** package manager

### Installation

1. Clone the repository and install dependencies:
   ```bash
   git clone <repository-url>
   cd zora-coin-mcp
   pnpm install
   ```

2. Build the project:
   ```bash
   pnpm build
   ```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Required: Your private key (starts with 0x)
PRIVATE_KEY=0x934d7f48b44af8e0d336981999d2bd1e4f94ff450f2f97f785fd600b0bc49685

# Required: Base network RPC URL
RPC_URL=https://mainnet.base.org
# Or for testing with Anvil:
# RPC_URL=http://localhost:8545
```

### MCP Client Integration
Below is a sample configuration you can use to install this MCP Server within your client of choice:
```json
{
  "mcpServers": {
      "zora-coin-mcp": {
         "command": "node",
         "args": ["/path/to/built/zora-coin-mcp/dist/index.js"],
         "env": {
            "PRIVATE_KEY": "0xa",
            "RPC_URL": "http://localhost:8545"
         }
      }
  }
}
```
You must first clone the repo and run `pnpm build` before integrating with a MCP Client


### Testing Setup

1. **Start Anvil** (for local testing):
   ```bash
   anvil --fork-url https://mainnet.base.org
   ```

2. **Run tests**:
   ```bash
   pnpm test
   ```

### Running the Server

Start the MCP server:
```bash
node dist/index.js
```

The server will run as a stdio-based MCP server, ready to receive tool calls from MCP clients.

## Implementation Choices

### Architecture Decisions

1. **STDIO** For the purposes of this coding assessment I choose to use stdio as the transport. It was easy to setup locally and allows the user to keep their private keys on their machine.

2. **@zoralabs/coins-sdk**: I choose to use the zora sdk because it provided a lot of the functionality necesarry to provide a useful demo. I did run into type issue and ambiguity when it came to implementing some of the contract calls. This was somewhat frustrating and led to debugging via abi assisted contract calls.  

3. **Zod and I/O Validation**: I wanted to ensure that all inputs and outputs are properly typed for testing and for greater context for the MCP server. 

4. **Modular Design**: Separated blockchain logic (`blockchain/zora.ts`) from MCP server logic (`zora-mcp.ts`) for better maintainability and testability. In the end I didn't need to seperate it much due to being able to directly use a lot of Zora's functions. But it was useful to be able to ensure that all blockchain functionality worked as expected before hooking things up to the MCP.



### Type Safety

- Always ensured that the project built successfully and had proper typing during development

## Assumptions and Limitations

### Major Limitations

1. **Testing**: I setup `src/zora-mcp.test.ts` as a hybrid integration test. I wanted to make actual requests to a RPC to ensure that tools were functioning as expected. In a production environment I would have setup a testing library more suitable for E2E tests even though vitest worked well in this time constrained scenario.
2. **Private Key Exposure**: This requires the user to provide their private key as a setting
    - Depending on the requirements using Account Abstraction for transaction management could be a useful solution
    - Using something like Privy could be a cool solution allowing the use of Oauth for transaction signing without the need of a private key
    - You could also apply delegation and permissions within the server or gated with a smart contract
    - You could add further safe guards such as limiting purchasing of more than $x of tokens.
3. **Installation**: 
    - Publish package to npm to make it easier to install via npx
4. **Streamable HTTP Transport**: This could be a useful alternative depending on the requirements. It would allow better analytics and further control on changes to the server. The negative being that it would shift some of the trust assumption to a more closed system. Although an Oauth integration with Privy for tx signing could be the bet of both worlds.

### Operational Limitations

1. **Gas Management**: No sophisticated gas estimation or fee management
2. **Transaction Monitoring**: Limited transaction receipt handling
3. **Rate Limiting**: No built-in rate limiting for API calls
4. **Caching**: No caching of blockchain data or coin details



## Development

### Project Structure

```
src/
├── types.ts              # TypeScript interfaces for Zora data
├── blockchain/
│   ├── zora.ts          # Wrapper functions for Zora SDK
│   └── zora.test.ts     # Unit tests for blockchain functions
├── zora-mcp.ts          # Main MCP server implementation
├── zora-mcp.test.ts     # Integration tests for MCP tools
└── index.ts             # Entry point and CLI setup
```

### Adding New Tools

To add a new MCP tool:

1. Define input/output schemas using Zod
2. Implement the tool logic in `zora-mcp.ts`
3. Register the tool with the MCP server
4. Add comprehensive tests
5. Update this README with usage examples

### Testing

The project includes both unit and integration tests:
- **Unit tests**: Test individual blockchain functions
- **Integration tests**: Test complete MCP tool workflows with real blockchain interactions

Run tests with: `pnpm test`

## Contributing

1. Ensure all tests pass before submitting PRs
2. Add tests for new functionality
3. Update documentation for any API changes
4. Follow the existing TypeScript and error handling patterns
