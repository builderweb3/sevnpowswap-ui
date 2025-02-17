import { TransactionResponse } from '@ethersproject/providers'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { MERKLE_DISTRIBUTOR_ADDRESS } from 'constants/addresses'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { useContract } from '../../hooks/useContract'
import { addTransaction } from './reducer'
import { TransactionDetails, TransactionInfo, TransactionType } from './types'

// helper that can take a ethers library transaction response and add it to the list of transactions
export function useTransactionAdder(): (response: TransactionResponse, info: TransactionInfo) => void {
  const { chainId, account } = useWeb3React()
  const dispatch = useAppDispatch()

  return useCallback(
    (response: TransactionResponse, info: TransactionInfo) => {
      if (!account) return
      if (!chainId) return

      const { hash } = response
      if (!hash) {
        throw Error('No transaction hash found.')
      }
      dispatch(addTransaction({ hash, from: account, info, chainId }))
    },
    [account, chainId, dispatch]
  )
}

// returns all the transactions for the current chain
export function useAllTransactions(): { [txHash: string]: TransactionDetails } {
  const { chainId } = useWeb3React()

  const state = useAppSelector((state) => state.transactions)

  return chainId ? state[chainId] ?? {} : {}
}

export function useTransaction(transactionHash?: string): TransactionDetails | undefined {
  const allTransactions = useAllTransactions()

  if (!transactionHash) {
    return undefined
  }

  return allTransactions[transactionHash]
}

export function useIsTransactionPending(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return !transactions[transactionHash].receipt
}

export function useIsTransactionConfirmed(transactionHash?: string): boolean {
  const transactions = useAllTransactions()

  if (!transactionHash || !transactions[transactionHash]) return false

  return Boolean(transactions[transactionHash].receipt)
}

/**
 * Returns whether a transaction happened in the last day (86400 seconds * 1000 milliseconds / second)
 * @param tx to check for recency
 */
export function isTransactionRecent(tx: TransactionDetails): boolean {
  return new Date().getTime() - tx.addedTime < 86_400_000
}

// returns whether a token has a pending approval transaction
export function useHasPendingApproval(token?: Token, spender?: string): boolean {
  const allTransactions = useAllTransactions()
  return useMemo(
    () =>
      typeof token?.address === 'string' &&
      typeof spender === 'string' &&
      Object.keys(allTransactions).some((hash) => {
        const tx = allTransactions[hash]
        if (!tx) return false
        if (tx.receipt) {
          return false
        } else {
          if (tx.info.type !== TransactionType.APPROVAL) return false
          return tx.info.spender === spender && tx.info.tokenAddress === token.address && isTransactionRecent(tx)
        }
      }),
    [allTransactions, spender, token?.address]
  )
}

function useMerkleDistributorContract() {
  const abiclaim = `[{"inputs":[],"name":"AlreadyClaimed","type":"error"},{"inputs":[],"name":"NothingToClaim","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"claimWithMapping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"claimWithRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"claimWithSignature","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_recipients","type":"address[]"},{"internalType":"uint256[]","name":"_amounts","type":"uint256[]"}],"name":"setClaimMapping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_claimRoot","type":"bytes32"}],"name":"setClaimRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_signer","type":"address"},{"internalType":"address","name":"_token","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimMapping","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"signer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]`
  return useContract(MERKLE_DISTRIBUTOR_ADDRESS, abiclaim, true)
}

// watch for submissions to claim
// return null if not done loading, return undefined if not found
export function useUserHasSubmittedClaim(account?: string): {
  claimSubmitted: boolean
  claimTxn: TransactionDetails | undefined
} {
  const allTransactions = useAllTransactions()

  const timenow = new Date().getTime()
  const distributorContract = useMerkleDistributorContract()
  const isClaimedResult = useSingleCallResult(distributorContract, 'claimMapping', [account?.toString()])
  // get the txn if it has been submitted
  const claimTxn = useMemo(() => {
    const txnIndex = Object.keys(allTransactions).find((hash) => {
      const tx = allTransactions[hash]
      return tx.info.type === TransactionType.CLAIM && tx.info.recipient === account
    })
    return txnIndex && allTransactions[txnIndex] ? allTransactions[txnIndex] : undefined
  }, [account, allTransactions])
  if (claimTxn) {
    if (
      Number(claimTxn.confirmedTime?.toString()) + 5000 >= timenow ||
      Number(isClaimedResult.result?.toString()) === 0
    ) {
      return { claimSubmitted: Boolean(claimTxn), claimTxn }
    } else {
      return { claimSubmitted: false, claimTxn: undefined }
    }
  }
  return { claimSubmitted: false, claimTxn: undefined }
}
