import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { PageName } from 'components/AmplitudeAnalytics/constants'
import { Trace } from 'components/AmplitudeAnalytics/Trace'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { LightCard } from 'components/Card'
import AirPanel from 'components/stakePow/AirPanel'
import OrbitPanel from 'components/stakePow/OrbitPanel'
import TetrisPanel from 'components/stakePow/TetrisPanel'
import VelocityPanel from 'components/stakePow/VelocityPanel'
import { POW_ETHW, SPOW_ETHW } from 'constants/tokens'
import JSBI from 'jsbi'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useState } from 'react'
import { useToggleWalletModal } from 'state/application/hooks'
import { useTokenBalance } from 'state/connection/hooks'
import { usePowBar, usePowBarStats } from 'state/single-stake/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import { AutoColumn } from '../../components/Column'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { ExternalLink, ThemedText } from '../../theme'
import { ClickableText, Dots } from '../Pool/styleds'
import DevelopmentGames from './DevelopmentGames'
import ReleasedGames from './ReleasedGames'

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.deprecated_text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
   flex-direction: column;
   margin: 15px;
 `};
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
  margin-top: 24px;
`

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const StakeClickableText = styled(ClickableText)<{ selected: boolean }>`
  color: ${({ selected, theme }) => (selected ? theme.deprecated_primary1 : theme.deprecated_bg5)};
  font-weight: ${({ selected }) => (selected ? 500 : 400)};
`

const LargeHeaderWhite = styled(ThemedText.LargeHeader)`
  color: white;
`

const activeClassName = 'active'

const StyledExternalLink = styled(ExternalLink)`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: lawngreen;
  font-size: 1.5rem;
  width: fit-content;
  margin: 0px auto;
  font-weight: 500;
  background: linear-gradient(45deg, #84034bed, #230328f0);
  padding: 10px 25px;
  border: 2px solid lawngreen;

  &.${activeClassName} {
    border-radius: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.deprecated_text1};
  }

  :hover,
  :focus {
    color: yellow;
    text-decoration: none;
    border: 2px solid yellow;
  }
`

enum StakeState {
  stakePOW = 'stakePOW',
  unstakeSPOW = 'unstakeSPOW',
}

const INPUT_CHAR_LIMIT = 18

export default function Games() {
  const theme = useTheme()
  const { chainId, account } = useWeb3React()
  const toggleWalletModal = useToggleWalletModal() // toggle wallet when disconnected

  const [stakeState, setStakeState] = useState<StakeState>(StakeState.stakePOW)
  const [input, _setInput] = useState<string>('')
  const [usingBalance, setUsingBalance] = useState(false)
  const [pendingTx, setPendingTx] = useState(false)
  const { enter, leave } = usePowBar()

  const isStaking = stakeState === StakeState.stakePOW

  const triBalance = useTokenBalance(account ?? undefined, POW_ETHW)
  const xTriBalance = useTokenBalance(account ?? undefined, SPOW_ETHW)

  const balance = isStaking ? triBalance : xTriBalance
  const parsedAmount = usingBalance ? balance : tryParseCurrencyAmount(input, balance?.currency)

  const [approvalState, handleApproval] = useApproveCallback(parsedAmount, SPOW_ETHW.address)

  // Reset input when toggling staking/unstaking
  function handleStakePOW() {
    setStakeState(StakeState.stakePOW)
    setInput('')
  }
  function handleUnstakeSPOW() {
    setStakeState(StakeState.unstakeSPOW)
    setInput('')
  }

  function setInput(v: string) {
    // Allows user to paste in long balances
    const value = v.slice(0, INPUT_CHAR_LIMIT)

    setUsingBalance(false)
    _setInput(value)
  }

  const maxAmountInput: CurrencyAmount<Currency> | undefined = maxAmountSpend(balance)
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))

  const handleClickMax = useCallback(() => {
    if (maxAmountInput) {
      setInput(maxAmountInput.toExact())
      setUsingBalance(true)
    }
  }, [maxAmountInput, setInput])

  function renderApproveButton() {
    if (!isStaking) {
      return null
    }

    return (
      <ButtonConfirmed
        mr="0.5rem"
        onClick={handleApproval}
        confirmed={approvalState === ApprovalState.APPROVED}
        disabled={approvalState !== ApprovalState.NOT_APPROVED}
      >
        {approvalState === ApprovalState.PENDING ? (
          <Dots>Approving</Dots>
        ) : approvalState === ApprovalState.APPROVED ? (
          'Approved'
        ) : (
          'Approve'
        )}
      </ButtonConfirmed>
    )
  }

  function renderStakeButton() {
    // If input does not have value
    if (parsedAmount?.greaterThan(JSBI.BigInt(0)) !== true) {
      return <ButtonPrimary disabled={true}>Enter an amount</ButtonPrimary>
    }

    // If account balance is less than inputted amount
    const insufficientFunds =
      (balance?.equalTo(JSBI.BigInt(0)) ?? false) || parsedAmount?.greaterThan(balance?.asFraction || 0)
    if (insufficientFunds) {
      return (
        <ButtonError error={true} disabled={true}>
          Insufficient Balance
        </ButtonError>
      )
    }

    // If user is unstaking, we don't need to check approval status
    const isDisabled = isStaking ? approvalState !== ApprovalState.APPROVED || pendingTx : pendingTx

    return (
      <ButtonPrimary disabled={isDisabled} onClick={handleStake}>
        {isStaking ? 'Stake' : 'Unstake'}
      </ButtonPrimary>
    )
  }

  async function handleStake() {
    try {
      setPendingTx(true)

      if (isStaking) {
        await enter(parsedAmount)
      } else {
        await leave(parsedAmount)
      }

      setInput('')
    } catch (e) {
      console.error(`Error ${isStaking ? 'Staking' : 'Unstaking'}: `, e)
    } finally {
      setPendingTx(false)
    }
  }

  const { totalTriStaked } = usePowBarStats()
  const totalTriStakedFormatted = totalTriStaked?.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return (
    <Trace page={PageName.STAKE_PAGE} shouldLogImpression>
      <>
        <PageWrapper>
          <VoteCard>
            <CardBGImage />
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontWeight={600} fontSize={16}>
                    <Trans>Games</Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontSize={14}>
                    <Trans>
                      7evn is a Erc20 on EthPoW designed for use as a gaming token for 7evn Games play. Games in the
                      7evn Gaming House will accept both PLS/EthW (the native PulseChain and EthPoW network token,
                      respectively ) and 7evn token. Using 7evn for gameplay with the added incentive of a 20% discount
                      as opposed to using the native token PLS/EthW token.
                    </Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <ExternalLink
                  style={{ color: theme.deprecated_white, textDecoration: 'underline' }}
                  target="_blank"
                  href="https://medium.com/@powswap/introducing-single-sided-staking-for-pow-680da52bdeb6"
                >
                  <ThemedText.DeprecatedWhite fontSize={14}>
                    <Trans>Read more about 7evn on the EthPoW lightpaper</Trans>
                  </ThemedText.DeprecatedWhite>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardBGImage />
            <CardNoise />
          </VoteCard>

          <TopSection gap="md">
            <ReleasedGames />
          </TopSection>

          <AutoColumn style={{ width: '100%', margin: '10px 0px' }}>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <AutoColumn gap="20px" justify="start">
                    <ThemedText.DeprecatedMediumHeader>PulseHex Velocity</ThemedText.DeprecatedMediumHeader>
                  </AutoColumn>
                  <AutoColumn gap="20px"></AutoColumn>
                </RowBetween>
                <VelocityPanel
                  value={input!}
                  onUserInput={setInput}
                  showMaxButton={!atMaxAmountInput}
                  currency={isStaking ? POW_ETHW : SPOW_ETHW}
                  id="stake-currency-input"
                  onMax={handleClickMax}
                />
              </AutoColumn>
              <div style={{ marginTop: '1rem' }}>
                {account == null ? (
                  <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
                ) : (
                  <RowBetween>
                    <StyledExternalLink id={`vlcty-nav-link`} href="https://www.sevndex.com/velocity/">
                      <Trans>Play</Trans>
                      <sup>↗</sup>
                    </StyledExternalLink>
                  </RowBetween>
                )}
              </div>
            </LightCard>
          </AutoColumn>

          <AutoColumn style={{ width: '100%', margin: '10px 0px' }}>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <AutoColumn gap="20px" justify="start">
                    <ThemedText.DeprecatedMediumHeader>Orbital Hexman</ThemedText.DeprecatedMediumHeader>
                  </AutoColumn>
                  <AutoColumn gap="20px"></AutoColumn>
                </RowBetween>
                <OrbitPanel
                  value={input!}
                  onUserInput={setInput}
                  showMaxButton={!atMaxAmountInput}
                  currency={isStaking ? POW_ETHW : SPOW_ETHW}
                  id="stake-currency-input"
                  onMax={handleClickMax}
                />
              </AutoColumn>
              <div style={{ marginTop: '1rem' }}>
                {account == null ? (
                  <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
                ) : (
                  <RowBetween>
                    <StyledExternalLink id={`orbit-nav-link`} href="https://www.sevndex.com/hexman/">
                      <Trans>Play</Trans>
                      <sup>↗</sup>
                    </StyledExternalLink>
                  </RowBetween>
                )}
              </div>
            </LightCard>
          </AutoColumn>

          <AutoColumn style={{ width: '100%', margin: '10px 0px' }}>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <AutoColumn gap="20px" justify="start">
                    <ThemedText.DeprecatedMediumHeader>7e7ris</ThemedText.DeprecatedMediumHeader>
                  </AutoColumn>
                  <AutoColumn gap="20px"></AutoColumn>
                </RowBetween>
                <TetrisPanel
                  value={input!}
                  onUserInput={setInput}
                  showMaxButton={!atMaxAmountInput}
                  currency={isStaking ? POW_ETHW : SPOW_ETHW}
                  id="stake-currency-input"
                  onMax={handleClickMax}
                />
              </AutoColumn>
              <div style={{ marginTop: '1rem' }}>
                {account == null ? (
                  <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
                ) : (
                  <RowBetween>
                    <StyledExternalLink id={`tetris-nav-link`} href="https://www.sevnhex.com/7e7ris/">
                      <Trans>Play</Trans>
                      <sup>↗</sup>
                    </StyledExternalLink>
                  </RowBetween>
                )}
              </div>
            </LightCard>
          </AutoColumn>
          <RowBetween />
          <TopSection gap="md">
            <DevelopmentGames />
          </TopSection>
          <AutoColumn style={{ width: '100%', margin: '10px 0px' }}>
            <LightCard>
              <AutoColumn gap="20px">
                <RowBetween>
                  <AutoColumn gap="20px" justify="start">
                    <ThemedText.DeprecatedMediumHeader>Air Battle</ThemedText.DeprecatedMediumHeader>
                  </AutoColumn>
                  <AutoColumn gap="20px"></AutoColumn>
                </RowBetween>
                <AirPanel
                  value={input!}
                  onUserInput={setInput}
                  showMaxButton={!atMaxAmountInput}
                  currency={isStaking ? POW_ETHW : SPOW_ETHW}
                  id="stake-currency-input"
                  onMax={handleClickMax}
                />
              </AutoColumn>
            </LightCard>
          </AutoColumn>
        </PageWrapper>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
