import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useState } from 'react'
import styled from 'styled-components/macro'

import { abi as MASTERCHEFMOD_ABI } from '../../abis/MasterChefMod.json'
import { useContract } from '../../hooks/useContract'
import { StakingInfo } from '../../state/stake/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { CloseIcon, ThemedText } from '../../theme'
import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { RowBetween } from '../Row'

function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean) {
  return useContract(stakingAddress, MASTERCHEFMOD_ABI, withSignerIfPossible)
}

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
}

export default function ClaimRewardModal({ isOpen, onDismiss, stakingInfo }: StakingModalProps) {
  const { account } = useWeb3React()

  // monitor call to help UI loading state
  const addTransaction = useTransactionAdder()
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onClaimReward() {
    if (stakingContract && stakingInfo?.earnedAmount && account) {
      setAttempting(true)
      await stakingContract
        .deposit(0, 0, { gasLimit: 350000 })
        .then((response: TransactionResponse) => {
          setHash(response.hash)
        })
        .catch((error: any) => {
          setAttempting(false)
          console.log(error)
        })
    }
  }

  let error: ReactNode | undefined
  if (!account) {
    error = <Trans>Connect Wallet</Trans>
  }
  if (!stakingInfo?.stakedAmount) {
    error = error ?? <Trans>Enter an amount</Trans>
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <ThemedText.DeprecatedMediumHeader>
              <Trans>Claim</Trans>
            </ThemedText.DeprecatedMediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          {stakingInfo?.earnedAmount && (
            <AutoColumn justify="center" gap="md">
              <ThemedText.DeprecatedBody fontWeight={600} fontSize={36}>
                {stakingInfo?.earnedAmount?.toSignificant(6)}
              </ThemedText.DeprecatedBody>
              <ThemedText.DeprecatedBody>
                <Trans>Unclaimed 7evn</Trans>
              </ThemedText.DeprecatedBody>
            </AutoColumn>
          )}
          <ThemedText.DeprecatedSubHeader style={{ textAlign: 'center' }}>
            <Trans>When you claim without withdrawing your liquidity remains in the mining pool.</Trans>
          </ThemedText.DeprecatedSubHeader>
          <ButtonError disabled={!!error} error={!!error && !!stakingInfo?.stakedAmount} onClick={onClaimReward}>
            {error ?? <Trans>Claim</Trans>}
          </ButtonError>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Claiming {stakingInfo?.earnedAmount?.toSignificant(6)} 7evn</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>Claimed 7evn!</Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
