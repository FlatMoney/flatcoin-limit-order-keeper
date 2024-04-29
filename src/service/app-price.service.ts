import { Injectable, Logger } from '@nestjs/common';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { PriceFeed } from '@pythnetwork/price-service-sdk';
import { BigNumber } from 'ethers';

@Injectable()
export class AppPriceService {
  // You can find the ids of prices at https://pyth.network/developers/price-feed-ids#pyth-evm-testnet
  private readonly priceIds: string[];

  constructor(private readonly connection: EvmPriceServiceConnection, private readonly logger: Logger) {
    if (process.env.PYTH_NETWORK_ETH_USD_PRICE_ID) {
      this.priceIds = [process.env.PYTH_NETWORK_ETH_USD_PRICE_ID];
    } else {
      throw new Error('env property PYTH_NETWORK_ETH_USD_PRICE_ID is not configured');
    }
  }

  async getPriceUpdates(): Promise<string[]> {
    // In order to use Pyth prices in your protocol you need to submit the price update data to Pyth contract in your target
    // chain. `getPriceFeedsUpdateData` creates the update data which can be submitted to your contract. Then your contract should
    // call the Pyth Contract with this data.
    const priceUpdates: string[] = await this.connection.getPriceFeedsUpdateData(this.priceIds);
    if (!priceUpdates) {
      throw new Error('failed to get PriceFeedsUpdateData');
    }
    return priceUpdates;
  }

  async getPrice(): Promise<BigNumber> {
    const priceFeeds: PriceFeed[] | undefined = await this.connection.getLatestPriceFeeds(this.priceIds);
    if (!priceFeeds) {
      throw new Error('failed to get LatestPriceFeeds');
    }
    return BigNumber.from(priceFeeds[0].getPriceUnchecked().price).mul(BigNumber.from(10).pow(10));
  }

  async getPriceByTimestamp(timestamp: number): Promise<BigNumber> {
    const priceFeed: PriceFeed = await this.connection.getPriceFeed(this.priceIds[0], timestamp);
    return BigNumber.from(priceFeed.getPriceUnchecked().price).mul(BigNumber.from(10).pow(10));
  }

  async getPriceUpdatesWithRetry(maxRetries: number, timeoutMillis: number): Promise<string[]> {
    return this.retry<string[]>(this.getPriceUpdates.bind(this), maxRetries, timeoutMillis);
  }

  async getPriceWithRetry(maxRetries: number, timeoutMillis: number): Promise<BigNumber> {
    return this.retry<BigNumber>(this.getPrice.bind(this), maxRetries, timeoutMillis);
  }

  async getPriceByTimestampWithRetry(timestamp: number, maxRetries: number, timeoutMillis: number): Promise<BigNumber> {
    return this.retry<BigNumber>(() => this.getPriceByTimestamp.bind(this)(timestamp), maxRetries, timeoutMillis);
  }

  async retry<T>(func: () => Promise<T>, maxRetries: number, timeoutMillis: number): Promise<T> {
    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        return await func();
      } catch (err) {
        this.logger.error(`Error querying ${func.name} (retries: ${retries}): ${err.message}`);
        // delay before the next retry
        await new Promise((resolve) => setTimeout(resolve, timeoutMillis)); // 1-second delay
      }
    }
    throw new Error(`Max retry attempts reached`);
  }
}
