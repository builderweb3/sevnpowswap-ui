import { Contract } from '@ethersproject/contracts'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useContract } from 'hooks/useContract'
import { useGetGamePrice } from 'hooks/useGetGamePrice'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { useCallback } from 'react'
import { useTokenBalance } from 'state/connection/hooks'
import { TransactionType } from 'state/transactions/types'

import { abi as ABI } from '../../abis/SushiBar.json'
import { POW_ETHW, SPOW_ETHW } from '../../constants/tokens'
import { useTransactionAdder } from '../transactions/hooks'

export const POWBAR_ADDRESS: {
  [chainId: number]: string
} = {
  10001: '0x5Bb2de70EeE1aD7206927bA72281351F141bA594',
}

export function usePowBar() {
  const addTransaction = useTransactionAdder()
  const barContract = usePowBarContract()

  const enter = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount) {
        const tx = await barContract?.enter(`0x${amount.quotient.toString(16)}`)
        return addTransaction(tx, { type: TransactionType.STAKE })
      }
    },
    [addTransaction, barContract]
  )

  const leave = useCallback(
    async (amount: CurrencyAmount<Token> | undefined) => {
      if (amount) {
        const tx = await barContract?.leave(`0x${amount.quotient.toString(16)}`)
        return addTransaction(tx, { type: TransactionType.UNSTAKE })
      }
    },
    [addTransaction, barContract]
  )

  return { enter, leave }
}

export function usePowBarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useWeb3React()
  return useContract(
    chainId && POWBAR_ADDRESS[chainId] ? POWBAR_ADDRESS[chainId] : undefined,
    ABI,
    withSignerIfPossible
  )
}

const USDT_SVLP: {
  [chainId: number]: string
} = {
  10001: '0xD276A2C832020837e6221c5cC2de030C7da2c115',
}

export function usePowBarStats() {
  const totalSPow = useTotalSupply(SPOW_ETHW)
  const totalPowStaked = useTokenBalance(SPOW_ETHW.address, POW_ETHW)
  const totalSevn = useGetGamePrice()
  // const price = (Number(tokenBTxn[0].toString()) / Number(tokenBTxn[1].toString() / 0.000000000001)) * 0.04

  const powToXPowRatio =
    totalPowStaked != null && totalSPow != null && totalPowStaked.greaterThan(0)
      ? totalSPow?.asFraction.divide(totalPowStaked.asFraction)
      : null

  return {
    totalTriStaked: totalPowStaked,
    totalXTri: totalSPow,
    triToXTRIRatio: powToXPowRatio,
    gameprice: totalSevn,
    theprice: totalSevn,
  }
}
