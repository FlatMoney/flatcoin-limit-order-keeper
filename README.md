# Flatcoin limit order keeper

## Configuration


| Variable                             | Required | Description                                                                                                                                               | Example                                                                                             |
|--------------------------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| DB_NAME                              | Yes      | Local path to SQLite storage                                                                                                                              | ../../positions.db                                                                                  |
| BLOCKCHAIN_NETWORK_NAME              | Yes      | Network name                                                                                                                                              | sepolia                                                                                             |
| CHAIN_ID                             | Yes      | Chain id                                                                                                                                                  | 11155111                                                                                            |
| PROVIDER_HTTPS_URL                   | Yes      | Provider URL                                                                                                                                              | https://ethereum-sepolia.publicnode.com                                                             |
| PYTH_NETWORK_PRICE_URI               | Yes      | Off-chain HTTP API endpoint used to fetch Pyth oracle prices                                                                                              | See https://docs.pyth.network/documentation                                                         |
| PYTH_NETWORK_ETH_USD_PRICE_ID        | Yes      | ETH/USD price feed ID                                                                                                                                     | See https://pyth.network/developers/price-feed-ids                                                  |
| LIMIT_ORDER_CONTRACT_ADDRESS         | Yes      | LiquidationModule contract address                                                                                                                        | See https://github.com/dhedge/flatcoin-v1/blob/testnet-system/deployments/testnet/testnet.base.json |
| LEVERAGE_MODULE_CONTRACT_ADDRESS     | Yes      | LeverageModule contract address                                                                                                                           | See https://github.com/dhedge/flatcoin-v1/blob/testnet-system/deployments/testnet/testnet.base.json |
| VIEWER_CONTRACT_ADDRESS              | Yes      | Viewer contract address                                                                                                                                   | See https://github.com/dhedge/flatcoin-v1/blob/testnet-system/deployments/testnet/testnet.base.json |
| SIGNER_WALLET_PK                     | Yes      | Signer wallet private key                                                                                                                                 |                                                                                                     |
| MAX_BATCH_SIZE_FOR_RPC_BATCH_REQUEST | Yes      | Batch size of positions to call via other RPC batch requests                                                                                              | 5                                                                                                   |
| BATCH_WAIT_TIME                      | Yes      | Wait time between batches, ms                                                                                                                             | 500                                                                                                 |
| ETH_PRICE_UPDATE_INTERVAL            | Yes      | Interval to update current ETH price, sec                                                                                                                 | 4                                                                                                   |



## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```
