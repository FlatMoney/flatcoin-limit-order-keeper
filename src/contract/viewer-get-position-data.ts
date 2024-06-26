export const ViewerGetPositionData = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getPositionData',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'averagePrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'marginDeposited',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'additionalSize',
            type: 'uint256',
          },
          {
            internalType: 'int256',
            name: 'entryCumulativeFunding',
            type: 'int256',
          },
          {
            internalType: 'int256',
            name: 'profitLoss',
            type: 'int256',
          },
          {
            internalType: 'int256',
            name: 'accruedFunding',
            type: 'int256',
          },
          {
            internalType: 'int256',
            name: 'marginAfterSettlement',
            type: 'int256',
          },
          {
            internalType: 'uint256',
            name: 'liquidationPrice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'limitOrderPriceLowerThreshold',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'limitOrderPriceUpperThreshold',
            type: 'uint256',
          },
        ],
        internalType: 'struct FlatcoinStructs.LeveragePositionData',
        name: 'positionData',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];
