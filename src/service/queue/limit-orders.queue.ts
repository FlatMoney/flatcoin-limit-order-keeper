import { Injectable } from '@nestjs/common';
import AVLTree from 'avl';
import { LimitOrder, StopLossOrder, TakeProfitOrder } from '../../dto/shared-types';
import { MaxUint256 } from '@ethersproject/constants';

@Injectable()
export class LimitOrdersQueue {
  private readonly stopLossOrders: AVLTree<string, StopLossOrder>;
  private readonly takeProfitsOrders: AVLTree<string, TakeProfitOrder>;
  private readonly tokenIdKeyMapStopLosses: Map<number, string>;
  private readonly tokenIdKeyMapTakeProfits: Map<number, string>;

  constructor() {
    this.stopLossOrders = new AVLTree((a, b) => +b - +a);
    this.takeProfitsOrders = new AVLTree((a, b) => +a - +b);
    this.tokenIdKeyMapStopLosses = new Map();
    this.tokenIdKeyMapTakeProfits = new Map();
  }

  public addLimitOrder(limitOrder: LimitOrder) {
    const tokenId = limitOrder.tokenId;
    if (limitOrder.priceLowerThreshold !== BigInt(0)) {
      if (this.tokenIdKeyMapStopLosses.get(tokenId)) {
        const keyStopLoss = this.tokenIdKeyMapStopLosses.get(tokenId);
        this.stopLossOrders.remove(keyStopLoss);
        this.tokenIdKeyMapStopLosses.delete(tokenId);
      }
      const key = this.generateId(limitOrder.priceLowerThreshold, tokenId);
      this.stopLossOrders.insert(key, new StopLossOrder(tokenId, limitOrder.priceLowerThreshold));
      this.tokenIdKeyMapStopLosses.set(tokenId, key);
    }

    if (limitOrder.priceUpperThreshold !== MaxUint256.toBigInt() && limitOrder.priceUpperThreshold !== BigInt(0)) {
      if (this.tokenIdKeyMapTakeProfits.get(limitOrder.tokenId)) {
        const keyTakeProfit = this.tokenIdKeyMapTakeProfits.get(tokenId);
        this.takeProfitsOrders.remove(keyTakeProfit);
        this.tokenIdKeyMapTakeProfits.delete(tokenId);
      }
      const key = this.generateId(limitOrder.priceUpperThreshold, tokenId);
      this.takeProfitsOrders.insert(key, new TakeProfitOrder(tokenId, limitOrder.priceUpperThreshold));
      this.tokenIdKeyMapTakeProfits.set(tokenId, key);
    }
  }

  public removeLimitOrder(tokenId: number) {
    const keyStopLoss = this.tokenIdKeyMapStopLosses.get(tokenId);
    const keyTakeProfit = this.tokenIdKeyMapTakeProfits.get(tokenId);
    this.stopLossOrders.remove(keyStopLoss);
    this.takeProfitsOrders.remove(keyTakeProfit);

    this.tokenIdKeyMapStopLosses.delete(tokenId);
    this.tokenIdKeyMapTakeProfits.delete(tokenId);
  }

  public getNearestStopLoss(): StopLossOrder {
    return this.stopLossOrders.at(0) ? this.stopLossOrders.at(0).data : null;
  }

  public getNearestTakeProfit(): TakeProfitOrder {
    return this.takeProfitsOrders.at(0) ? this.takeProfitsOrders.at(0).data : null;
  }

  public getAllTakeProfits(): TakeProfitOrder[] {
    return this.takeProfitsOrders.values();
  }

  public getAllStopLosses(): StopLossOrder[] {
    return this.stopLossOrders.values();
  }

  private generateId(price: bigint, tokenId: number): string {
    return price.toString() + '.' + tokenId.toString();
  }
}
