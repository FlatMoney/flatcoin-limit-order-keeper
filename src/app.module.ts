import { Logger, Module } from '@nestjs/common';

import { LoggingModule } from './config/logging.module';
import { EvmPriceServiceConnection } from '@pythnetwork/pyth-evm-js';
import { ConfigModule } from '@nestjs/config';
import { AppTxExecutorService } from './service/app-tx-executor.service';
import { EthersModule } from 'nestjs-ethers';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LimitOrdersQueue } from './service/queue/limit-orders.queue';
import { LimitOrderQueueInitializer } from './service/queue/limit-order.queue.initializer';
import { LimitOrderKeeper } from './limit-order.keeper';
import { ScheduleModule } from '@nestjs/schedule';

import { RepositoryModule } from './config/repository.module';
import { ListenerService } from './listener.service';
import { AppPriceService } from './service/app-price.service';
import { PositionRepository } from './repostory/position.repository';
import { PositionEntity } from './repostory/entity/position-entity';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import {ErrorHandler} from "./service/error.handler";

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggingModule,
    RepositoryModule,
    ScheduleModule.forRoot(),
    PrometheusModule.register(),
    EthersModule.forRoot({
      network: {
        name: process.env.NETWORK,
        chainId: +process.env.CHAIN_ID,
      },
      custom: process.env.PROVIDER_HTTPS_URL,
      useDefaultProvider: false,
    }),
    TypeOrmModule.forFeature([PositionEntity]),
  ],
  controllers: [],
  providers: [
    Logger,
    AppPriceService,

    PositionRepository,
    AppTxExecutorService,
    LimitOrdersQueue,
    LimitOrderQueueInitializer,
    LimitOrderKeeper,
    ListenerService,
    ErrorHandler,
    {
      provide: EvmPriceServiceConnection,
      useValue: new EvmPriceServiceConnection(process.env.PYTH_NETWORK_PRICE_SERVCE_URI),
    },
  ],
})
export class AppModule {}
