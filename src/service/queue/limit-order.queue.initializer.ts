import { Injectable, Logger } from '@nestjs/common';
import { AppTxExecutorService } from '../app-tx-executor.service';
import { LimitOrdersQueue } from './limit-orders.queue';

import { chunk } from 'lodash';
import { BigNumber } from 'ethers';
import { MaxUint256 } from '@ethersproject/constants';
import { LeveragePositionData, LimitOrder } from '../../dto/shared-types';
import { delay } from '../../utils/utils';
import { PositionRepository } from '../../repostory/position.repository';

@Injectable()
export class LimitOrderQueueInitializer {
  private readonly maxBatchSizeForRpcBatchRequest;
  private readonly batchWaitTime;

  constructor(
    private readonly logger: Logger,
    private readonly appTxExecutorService: AppTxExecutorService,
    private readonly positionRepository: PositionRepository,
    private readonly queue: LimitOrdersQueue,
  ) {
    this.maxBatchSizeForRpcBatchRequest = +process.env.MAX_BATCH_SIZE_FOR_RPC_BATCH_REQUEST;
    this.batchWaitTime = +process.env.BATCH_WAIT_TIME;
    (async () => {
      await this.initPositionsQueue();
    })();
  }

  private async initPositionsQueue() {
    try {
      const startTime = Date.now();
      this.logger.log('start restoring all open positions ...');

      const allOpenPositionsFromDb = await this.positionRepository.getAll();
      this.logger.log(`${allOpenPositionsFromDb.length} positions loaded from DB ...`);

      this.logger.log('start refreshing sl and tp prices for it ...');
      for (const batchTokenIds of chunk(
        allOpenPositionsFromDb.map((p) => p.tokenId),
        +process.env.MAX_BATCH_SIZE_FOR_RPC_BATCH_REQUEST,
      )) {
        const limitOrders = await this.appTxExecutorService.getPositionDataBatched(batchTokenIds);
        limitOrders.forEach((position) => {
          this.logger.log(
            `position ${position.tokenId} has sl price ${position.limitOrderPriceLowerThreshold} tp price ${position.limitOrderPriceUpperThreshold}.`,
          );
          if (this.hasLimitOrder(position)) {
            this.queue.addLimitOrder(
              new LimitOrder(position.tokenId.toNumber(), position.limitOrderPriceLowerThreshold.toBigInt(), position.limitOrderPriceUpperThreshold.toBigInt()),
            );
          }
        });
        await delay(+process.env.BATCH_WAIT_TIME);
      }

      this.logger.log('start querying new positions via rpc ...');
      const positionWithLastTokenId = allOpenPositionsFromDb.sort((a, b) => b.tokenId - a.tokenId)[0];
      let fromTokenId = positionWithLastTokenId ? +positionWithLastTokenId.tokenId + 1 : 0;
      const toTokenId = (await this.appTxExecutorService.tokenIdNext()) + 10;
      let toTokenIdForBatchRequest;

      while (fromTokenId < toTokenId) {
        toTokenIdForBatchRequest = fromTokenId + this.maxBatchSizeForRpcBatchRequest;
        const newLimitOrders = (await this.appTxExecutorService.getPositionDataBatchedFromTo(fromTokenId, toTokenIdForBatchRequest)).filter((position) =>
          this.hasLimitOrder(position),
        );
        this.logger.log(`fetched ${newLimitOrders.length} limit orders via rpc tokenIds ${newLimitOrders.map((p) => p.tokenId)}`);
        for (const newLimitOrder of newLimitOrders) {
          const tokenId = newLimitOrder.tokenId.toNumber();
          this.queue.addLimitOrder(
            new LimitOrder(tokenId, newLimitOrder.limitOrderPriceLowerThreshold.toBigInt(), newLimitOrder.limitOrderPriceUpperThreshold.toBigInt()),
          );
        }
        fromTokenId = fromTokenId + this.maxBatchSizeForRpcBatchRequest + 1;
      }
      this.logger.log(`finished restoring all open limit orders in ${Date.now() - startTime} ms`);
    } catch (error) {
      this.logger.error('failed to initialize queue', error);
      throw error;
    }
  }

  private hasLimitOrder(p: LeveragePositionData): boolean {
    return !(
      BigNumber.from(0).eq(p.limitOrderPriceLowerThreshold) &&
      (MaxUint256.eq(p.limitOrderPriceUpperThreshold) || BigNumber.from(0).eq(p.limitOrderPriceUpperThreshold))
    );
  }
}
