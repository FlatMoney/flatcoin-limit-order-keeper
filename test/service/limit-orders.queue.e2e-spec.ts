import { LimitOrdersQueue } from '../../src/service/queue/limit-orders.queue';
import { Test, TestingModule } from '@nestjs/testing';

import { BigNumber } from 'ethers';
import { LimitOrder } from '../../src/dto/shared-types';
import { MaxUint256 } from '@ethersproject/constants';

describe('LimitOrdersQueue', () => {
  let limitOrdersQueue: LimitOrdersQueue;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [LimitOrdersQueue],
    }).compile();
    limitOrdersQueue = app.get(LimitOrdersQueue);
  });

  it('should return 1 limit order', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), BigNumber.from(1100).toBigInt()));

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(1);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(1);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1100));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1000));
  });

  it('should return 1 nearest limits for each queue, put many limit orders', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), BigNumber.from(1300).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(2, BigNumber.from(900).toBigInt(), BigNumber.from(1250).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(3, BigNumber.from(0).toBigInt(), BigNumber.from(1800).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(4, BigNumber.from(1200).toBigInt(), BigNumber.from(1700).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(5, BigNumber.from(0).toBigInt(), MaxUint256.toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(6, BigNumber.from(1150).toBigInt(), BigNumber.from(1400).toBigInt()));

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(4);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(5);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1250));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1200));
  });

  it('should return 1 nearest limits for each queue, put same limit orders', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), BigNumber.from(1100).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(2, BigNumber.from(900).toBigInt(), BigNumber.from(1850).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(0).toBigInt(), BigNumber.from(1800).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1200).toBigInt(), BigNumber.from(1300).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(4, BigNumber.from(0).toBigInt(), MaxUint256.toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(6, BigNumber.from(1150).toBigInt(), BigNumber.from(1400).toBigInt()));

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(3);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(3);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1300));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1200));
  });

  it('should return 1 nearest limits for each queue, remove limit orders', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), BigNumber.from(1300).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(2, BigNumber.from(900).toBigInt(), BigNumber.from(1250).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(5, BigNumber.from(950).toBigInt(), MaxUint256.toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(6, BigNumber.from(1150).toBigInt(), BigNumber.from(1400).toBigInt()));
    limitOrdersQueue.removeLimitOrder(2);
    limitOrdersQueue.removeLimitOrder(6);

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(2);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(1);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1300));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1000));
  });

  it('should return 1 nearest limits for each queue, remove limit orders and add again', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), BigNumber.from(1800).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(2, BigNumber.from(900).toBigInt(), BigNumber.from(1250).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(5, BigNumber.from(950).toBigInt(), MaxUint256.toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(6, BigNumber.from(1150).toBigInt(), BigNumber.from(1400).toBigInt()));
    limitOrdersQueue.removeLimitOrder(2);
    limitOrdersQueue.removeLimitOrder(6);
    limitOrdersQueue.addLimitOrder(new LimitOrder(5, BigNumber.from(1200).toBigInt(), BigNumber.from(1700).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(6, BigNumber.from(1150).toBigInt(), BigNumber.from(1400).toBigInt()));

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(3);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(3);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1400));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1200));
  });

  it('should return 1 limit order, put empty tp an sl', () => {
    limitOrdersQueue.addLimitOrder(new LimitOrder(1, BigNumber.from(1000).toBigInt(), MaxUint256.toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(2, BigNumber.from(0).toBigInt(), BigNumber.from(1100).toBigInt()));
    limitOrdersQueue.addLimitOrder(new LimitOrder(3, BigNumber.from(0).toBigInt(), BigNumber.from(0).toBigInt()));

    expect(limitOrdersQueue.getAllStopLosses().length).toBe(1);
    expect(limitOrdersQueue.getAllTakeProfits().length).toBe(1);
    expect(limitOrdersQueue.getNearestTakeProfit().tpPrice).toBe(BigInt(1100));
    expect(limitOrdersQueue.getNearestStopLoss().slPrice).toBe(BigInt(1000));
  });
});
