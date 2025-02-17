import { TransactionResponse } from '@ethersproject/providers'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { MERKLE_DISTRIBUTOR_ADDRESS } from 'constants/addresses'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useEffect, useState } from 'react'

import { SEVN_ETHW } from '../../constants/tokens'
import { useContract } from '../../hooks/useContract'
import { isAddress } from '../../utils'
import { useTransactionAdder } from '../transactions/hooks'
import { TransactionType } from '../transactions/types'

const abiclaim = `[{"inputs":[],"name":"AlreadyClaimed","type":"error"},{"inputs":[],"name":"NothingToClaim","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"claimWithMapping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32[]","name":"_proof","type":"bytes32[]"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"claimWithRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"claimWithSignature","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address[]","name":"_recipients","type":"address[]"},{"internalType":"uint256[]","name":"_amounts","type":"uint256[]"}],"name":"setClaimMapping","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"_claimRoot","type":"bytes32"}],"name":"setClaimRoot","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_signer","type":"address"},{"internalType":"address","name":"_token","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"claimMapping","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimRoot","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"signer","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]`

function useMerkleDistributorContract() {
  return useContract(MERKLE_DISTRIBUTOR_ADDRESS, abiclaim, true)
}

interface UserClaimData {
  index: number
  amount: string
  proof: string[]
  flags?: {
    isSOCKS: boolean
    isLP: boolean
    isUser: boolean
  }
}

type LastAddress = string
type ClaimAddressMapping = { [firstAddress: string]: LastAddress }
let FETCH_CLAIM_MAPPING_PROMISE: Promise<ClaimAddressMapping> | null = null
function fetchClaimMapping(): Promise<ClaimAddressMapping> {
  console.log('getting mappings')
  return (
    FETCH_CLAIM_MAPPING_PROMISE ??
    (FETCH_CLAIM_MAPPING_PROMISE = fetch(`/mapping.json`)
      .then((res) => res.json())
      .catch((error) => {
        console.error('Failed to get claims mapping', error)
        FETCH_CLAIM_MAPPING_PROMISE = null
      }))
  )
}

const FETCH_CLAIM_FILE_PROMISES: { [startingAddress: string]: Promise<{ [address: string]: UserClaimData }> } = {}
function fetchClaimFile(key: string): Promise<{ [address: string]: UserClaimData }> {
  console.log('key: ' + key)
  return (
    FETCH_CLAIM_FILE_PROMISES[key] ??
    (FETCH_CLAIM_FILE_PROMISES[key] = fetch(`/${key}.json`)
      .then((res) => res.json())
      .catch((error) => {
        console.error(`Failed to get claim file mapping for starting address ${key}`, error)
        delete FETCH_CLAIM_FILE_PROMISES[key]
      }))
  )
}

const FETCH_CLAIM_PROMISES: { [key: string]: Promise<UserClaimData> } = {}
// returns the claim for the given address, or null if not valid
function fetchClaim(account: string): Promise<UserClaimData> {
  const formatted = isAddress(account)
  if (!formatted) return Promise.reject(new Error('Invalid address'))

  return (
    FETCH_CLAIM_PROMISES[account] ??
    (FETCH_CLAIM_PROMISES[account] = fetchClaimMapping()
      .then((mapping) => {
        const sorted = Object.keys(mapping).sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))

        for (const startingAddress of sorted) {
          const lastAddress = mapping[startingAddress]
          if (startingAddress.toLowerCase() <= formatted.toLowerCase()) {
            if (formatted.toLowerCase() <= lastAddress.toLowerCase()) {
              console.log('found claim')
              return startingAddress
            }
          } else {
            throw new Error(`Claim for ${formatted} was not found in partial search`)
          }
        }
        throw new Error(`Claim for ${formatted} was not found after searching all mappings`)
      })
      .then(fetchClaimFile)
      .then((result) => {
        if (result[formatted]) return result[formatted]
        throw new Error(`Claim for ${formatted} was not found in claim file!`)
      })
      .catch((error) => {
        console.debug('Claim fetch failed', error)
        throw error
      }))
  )
}

// parse distributorContract blob and detect if user has claim data
// null means we know it does not
export function useUserClaimData(account: string | null | undefined): UserClaimData | null {
  const { chainId } = useWeb3React()

  const [claimInfo, setClaimInfo] = useState<{ [account: string]: UserClaimData | null }>({})

  useEffect(() => {
    if (!account || chainId !== 10001) return

    fetchClaim(account)
      .then((accountClaimInfo) =>
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: accountClaimInfo,
          }
        })
      )
      .catch(() => {
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: null,
          }
        })
      })
  }, [account, chainId])

  return account && chainId === 10001 ? claimInfo[account] : null
}

export function useUserClaimData1(account: string | null | undefined): UserClaimData | null {
  const { chainId } = useWeb3React()

  const [claimInfo, setClaimInfo] = useState<{ [account: string]: UserClaimData | null }>({})

  const distributorContract = useMerkleDistributorContract()
  const isClaimedResult = useSingleCallResult(distributorContract, 'claimMapping', [account?.toString()])
  useEffect(() => {
    if (!account || chainId !== 10001) return

    fetchClaim(account)
      .then((accountClaimInfo) =>
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: accountClaimInfo,
          }
        })
      )
      .catch(() => {
        setClaimInfo((claimInfo) => {
          return {
            ...claimInfo,
            [account]: null,
          }
        })
      })
  }, [account, chainId, isClaimedResult.result])

  return account && chainId === 10001 ? claimInfo[account] : null
}

// check if user is in blob and has not yet claimed UNI
export function useUserHasAvailableClaim(account: string | null | undefined): boolean {
  const userClaimData = useUserClaimData(account)
  const distributorContract = useMerkleDistributorContract()
  const isClaimedResult = useSingleCallResult(distributorContract, 'claimed', [account?.toString()])
  // user is in blob and contract marks as unclaimed
  return Boolean(!isClaimedResult.loading && isClaimedResult.result?.[0] === false)
}

export function useUserUnclaimedAmount(account: string | null | undefined): CurrencyAmount<Token> | undefined {
  const { chainId } = useWeb3React()
  const userClaimData = useUserClaimData(account)
  const canClaim = useUserHasAvailableClaim(account)
  const distributorContract = useMerkleDistributorContract()
  const isClaimedResult = useSingleCallResult(distributorContract, 'claimMapping', [account?.toString()])
  console.log('claimMapping: ' + isClaimedResult.result)
  const uni = chainId ? SEVN_ETHW : undefined
  if (!uni) return undefined
  if (!canClaim || !userClaimData || !isClaimedResult) {
    if (isClaimedResult.result?.[0] === 0) {
      return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(0))
    }
    return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(0))
  }
  return CurrencyAmount.fromRawAmount(uni, JSBI.BigInt(isClaimedResult.result?.[0]))
}

export function useClaimCallback(account: string | null | undefined): {
  claimCallback: () => Promise<string>
} {
  // get claim data for this account
  const { provider, chainId } = useWeb3React()
  const claimData = useUserClaimData(account)

  // used for popup summary
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(account)
  const addTransaction = useTransactionAdder()
  const distributorContract = useMerkleDistributorContract()

  const claimCallback = async function () {
    if (!account || !provider || !chainId || !distributorContract) return

    const args = [null]

    return distributorContract.estimateGas['claimWithMapping']().then((estimatedGasLimit) => {
      return distributorContract.claimWithMapping().then((response: TransactionResponse) => {
        addTransaction(response, {
          type: TransactionType.CLAIM,
          recipient: account,
          uniAmountRaw: unclaimedAmount?.quotient.toString(),
        })
        return response.hash
      })
    })
  }

  return { claimCallback }
}
