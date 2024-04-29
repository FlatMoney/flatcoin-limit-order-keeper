import { BigNumber } from 'ethers';

export class LimitOrder {
  tokenId: number;
  priceLowerThreshold: bigint;
  priceUpperThreshold: bigint;

  constructor(tokenId: number, priceLowerThreshold: bigint, priceUpperThreshold: bigint) {
    this.tokenId = tokenId;
    this.priceLowerThreshold = priceLowerThreshold;
    this.priceUpperThreshold = priceUpperThreshold;
  }
}

export class StopLossOrder {
  tokenId: number;
  slPrice: bigint;

  constructor(tokenId: number, slPrice: bigint) {
    this.tokenId = tokenId;
    this.slPrice = slPrice;
  }
}

export class TakeProfitOrder {
  tokenId: number;
  tpPrice: bigint;

  constructor(tokenId: number, tpPrice: bigint) {
    this.tokenId = tokenId;
    this.tpPrice = tpPrice;
  }
}

export class LeveragePositionData {
  tokenId: BigNumber;
  limitOrderPriceLowerThreshold: BigNumber;
  limitOrderPriceUpperThreshold: BigNumber;
}
