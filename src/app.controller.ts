import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { ClientStatisticsService } from './ORM/client-statistics/client-statistics.service';
import { ClientService } from './ORM/client/client.service';



@Controller()
export class AppController {
  constructor(
    private readonly clientService: ClientService,
    private readonly clientStatisticsService: ClientStatisticsService
  ) { }

  @Get()
  async getInfo() {
    return {
      clients: await this.clientService.connectedClientCount()
    }
  }

  @Get('client/:address')
  async getClientInfo(@Param('address') address: string) {

    const workers = await this.clientService.getByAddress(address);

    const chartData = await this.clientStatisticsService.getChartDataForAddress(address);

    return {
      workersCount: workers.length,
      workers: await Promise.all(
        workers.map(async (worker) => {
          return {
            sessionId: worker.sessionId,
            name: worker.clientName,
            bestDifficulty: Math.floor(worker.bestDifficulty),
            hashRate: Math.floor(await this.clientStatisticsService.getHashRateForSession(worker.address, worker.clientName, worker.sessionId)),
            startTime: worker.startTime
          };
        })
      ),
      chartData
    }
  }

  @Get('client/:address/:workerName')
  async getWorkerGroupInfo(@Param('address') address: string, @Param('workerName') workerName: string) {

    const workers = await this.clientService.getByName(address, workerName);

    const bestDifficulty = workers.reduce((pre, cur, idx, arr) => {
      if (cur.bestDifficulty > pre) {
        return cur.bestDifficulty;
      }
      return pre;
    }, 0);

    const chartData = await this.clientStatisticsService.getChartDataForGroup(address, workerName);
    return {

      name: workerName,
      bestDifficulty: Math.floor(bestDifficulty),
      chartData: chartData,

    }
  }

  @Get('client/:address/:workerName/:sessionId')
  async getWorkerInfo(@Param('address') address: string, @Param('workerName') workerName: string, @Param('sessionId') sessionId: string) {

    const worker = await this.clientService.getBySessionId(address, workerName, sessionId);
    if (worker == null) {
      return new NotFoundException();
    }
    const chartData = await this.clientStatisticsService.getChartDataForSession(worker.address, worker.clientName, worker.sessionId);

    return {
      sessionId: worker.sessionId,
      name: worker.clientName,
      bestDifficulty: Math.floor(worker.bestDifficulty),
      chartData: chartData,
      startTime: worker.startTime
    }
  }
}
