import { Injectable, Logger } from '@nestjs/common';
import { EthersContract, InjectContractProvider, InjectEthersProvider } from 'nestjs-ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { LimitOrder as LimitOrderContract } from './contract/limit-order';

import { LimitOrdersQueue } from './service/queue/limit-orders.queue';
import { LimitOrder } from './dto/shared-types';

@Injectable()
export class ListenerService {
  constructor(
    private readonly logger: Logger,
    @InjectContractProvider()
    private readonly ethersContract: EthersContract,
    @InjectEthersProvider()
    private readonly customProvider: JsonRpcProvider,

    private readonly limitOrdersQueue: LimitOrdersQueue,
  ) {
    this.listenLimitOrderEvents();
  }

  listenLimitOrderEvents(): void {
    const limitOrderContractAddress = process.env.LIMIT_ORDER_CONTRACT_ADDRESS;
    const limitOrderContract: Contract = this.ethersContract.create(limitOrderContractAddress, LimitOrderContract);
    this.logger.log(`Listening limit order events for contract ${limitOrderContractAddress} ...`);

    this.listenLimitOrderAnnouncedEvent(limitOrderContract);
    this.listenLimitOrderExecutedEvent(limitOrderContract);
    this.listenLimitOrderCancelledEvent(limitOrderContract);
  }

  listenLimitOrderAnnouncedEvent(limitOrderContract: Contract): void {
    limitOrderContract.on('LimitOrderAnnounced', async (account, tokenId, priceLowerThreshold, priceUpperThreshold, event) => {
      try {
        this.logger.log(`new LimitOrderAnnounced event for token id ${tokenId}, txHash ${event.transactionHash}...`);
        const announcedLimitOrder = new LimitOrder(tokenId.toNumber(), priceLowerThreshold.toBigInt(), priceUpperThreshold.toBigInt());
        this.limitOrdersQueue.addLimitOrder(announcedLimitOrder);
        this.logger.log(
          `parsed LimitOrderAnnounced event for token id ${tokenId}, priceLowerThreshold ${priceLowerThreshold}, priceUpperThreshold ${priceUpperThreshold} txHash ${event.transactionHash}`,
        );
      } catch (error) {
        this.logger.error(`failed to process LimitOrderAnnounced event for token id ${tokenId}, txHash ${event.transactionHash}`, error);
      }
    });
  }

  listenLimitOrderExecutedEvent(limitOrderContract: Contract): void {
    limitOrderContract.on('LimitOrderExecuted', async (account, tokenId, keeperFee, price, limitOrderType, event) => {
      try {
        this.logger.log(`new LimitOrderExecuted event for token id ${tokenId}, txHash ${event.transactionHash}...`);
        await this.limitOrdersQueue.removeLimitOrder(tokenId.toNumber());
        this.logger.log(`order for token id ${tokenId}, txHash ${event.transactionHash} was removed from queue`);
      } catch (error) {
        this.logger.error(`failed to process LimitOrderExecuted for token id ${tokenId}, txHash ${event.transactionHash}`, error);
      }
    });
  }

  listenLimitOrderCancelledEvent(limitOrderContract: Contract): void {
    limitOrderContract.on('LimitOrderCancelled', async (account, tokenId, event) => {
      try {
        this.logger.log(`new LimitOrderCancelled event for account ${account}, tokenId ${tokenId}, txHash ${event.transactionHash}...`);
        this.limitOrdersQueue.removeLimitOrder(tokenId.toNumber());
        this.logger.log(`limit order for account ${account}, tokenId ${tokenId}, txHash ${event.transactionHash} was removed from queue`);
      } catch (error) {
        this.logger.error(`failed to process LimitOrderCancelled for account ${account}, tokenId ${tokenId}, txHash ${event.transactionHash}`, error);
      }
    });
  }
}
