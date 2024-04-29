import { Injectable, Logger } from '@nestjs/common';
import { LimitOrdersQueue } from './service/queue/limit-orders.queue';
import { AppTxExecutorService } from './service/app-tx-executor.service';

import { Cron, CronExpression } from '@nestjs/schedule';
import { chunk } from 'lodash';
import { delay } from './utils/utils';
import { AppPriceService } from './service/app-price.service';

@Injectable()
export class LimitOrderKeeper {
  private activeKeeperTasks: Record<number, boolean> = {};
  private currentEthPrice: bigint;
  private ethPriceUpdateAt = 0;
  private readonly ethPriceRefreshIntervalSec;
  private readonly maxBatchSizeForRpcBatchRequest;
  constructor(
    private readonly queue: LimitOrdersQueue,
    private readonly logger: Logger,
    private readonly appPriceService: AppPriceService,

    private readonly appTxExecutorService: AppTxExecutorService,
  ) {
    this.maxBatchSizeForRpcBatchRequest = +process.env.MAX_BATCH_SIZE_FOR_RPC_BATCH_REQUEST;
    this.ethPriceRefreshIntervalSec = +process.env.ETH_PRICE_UPDATE_INTERVAL_SEC;
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async executeKeeper() {
    try {
      const orderWithNearestTakeProfit = this.queue.getNearestTakeProfit();
      const orderWithNearestStopLoss = this.queue.getNearestStopLoss();
      if (orderWithNearestTakeProfit || orderWithNearestTakeProfit) {
        await this.updateEthPrice();
      }
      if (this.currentEthPrice <= orderWithNearestStopLoss?.slPrice || this.currentEthPrice >= orderWithNearestTakeProfit?.tpPrice) {
        const allTakeProfits = this.queue.getAllTakeProfits();
        const allStopLosses = this.queue.getAllStopLosses();
        this.logger.log(
          `in queue ${allTakeProfits.length} takeProfits, ${allStopLosses.length} stopLosses, top sl price ${orderWithNearestStopLoss?.slPrice} top tp price ${orderWithNearestTakeProfit?.tpPrice}`,
        );
        let tokenIds: number[] = [];
        tokenIds = tokenIds.concat(allStopLosses.filter((sl) => this.currentEthPrice <= sl.slPrice).map((sl) => sl.tokenId));
        tokenIds = tokenIds.concat(allTakeProfits.filter((tp) => this.currentEthPrice >= tp.tpPrice).map((tp) => tp.tokenId));
        tokenIds = tokenIds.filter((tokenId) => !this.activeKeeperTasks[tokenId]);
        this.logger.log(`limit orders [${tokenIds}] can be executed`);
        await this.executeLimitOrders(tokenIds);
      }
    } catch (error) {
      this.logger.error('error in limit order keeper', error);
    }
  }

  private async executeLimitOrders(tokenIds: number[]): Promise<void> {
    for (const batch of chunk(tokenIds, this.maxBatchSizeForRpcBatchRequest)) {
      let nonce = await this.appTxExecutorService.getNonce();
      const batches = batch.map((tokenId) => {
        this.execAsyncKeeperCallback(tokenId, () => this.executeLimitOrder(tokenId, nonce));
        nonce++;
      });
      await Promise.all(batches);
      await delay(100);
    }
  }

  private async executeLimitOrder(tokenId: number, nonce: number) {
    try {
      let priceFeed;
      try {
        priceFeed = await this.appPriceService.getPriceUpdates();
      } catch (error) {
        this.logger.error('failed to get price feeds');
      }
      const txHash: string = await this.appTxExecutorService.executeLimitOrder(tokenId, priceFeed, nonce);
      if (txHash) {
        this.queue.removeLimitOrder(tokenId);
        this.logger.log(`limit order ${tokenId} was executed, txHash ${txHash}`);
      }
    } catch (error) {
      this.logger.error(`error while executing limit order position ${tokenId}`, error);
    }
  }

  private async execAsyncKeeperCallback(tokenId: number, cb: () => Promise<void>): Promise<void> {
    if (this.activeKeeperTasks[tokenId]) {
      // Skip task as its already running.
      return;
    }
    this.activeKeeperTasks[tokenId] = true;
    try {
      await cb();
    } catch (err) {
      this.logger.error(`error executing limit order tokenId ${tokenId}\n${err}`);
      this.logger.error((err as Error).stack);
    }
    delete this.activeKeeperTasks[tokenId];
  }

  private async updateEthPrice() {
    try {
      if (Date.now() - this.ethPriceUpdateAt > this.ethPriceRefreshIntervalSec * 1000) {
        //this.logger.log('start refreshing current eth price ...');
        this.currentEthPrice = (await this.appPriceService.getPriceWithRetry(1, 1000)).toBigInt();
        this.ethPriceUpdateAt = Date.now();
      }
    } catch (error) {
      this.logger.error('failed to update current eth price', error);
    }
  }
}
