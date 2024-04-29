import { Injectable, Logger } from '@nestjs/common';
import { FlatcoinErrors } from '../contract/flatcoin-errors';
import { ethers } from 'ethers';
import { Interface } from 'ethers/lib/utils';

@Injectable()
export class ErrorHandler {
  private readonly errorInterface: Interface;

  constructor(private readonly logger: Logger) {
    this.errorInterface = new ethers.utils.Interface(FlatcoinErrors);
  }

  public getGasEstimateErrorName(gasEstimateError: string): string {
    if (!gasEstimateError) return '';
    try {
      const jsonStartIndex = gasEstimateError.toString().indexOf('error=') + 6;
      const jsonEndIndex = gasEstimateError.toString().indexOf(', code=');
      if (jsonStartIndex > 0) {
        const errorJSON = JSON.parse(gasEstimateError.toString().slice(jsonStartIndex, jsonEndIndex));
        return this.errorInterface.parseError(errorJSON.error.data).name;
      } else {
        return gasEstimateError;
      }
    } catch (error) {
      this.logger.error("can't get gas estimate error", error);
      return '';
    }
  }
}
