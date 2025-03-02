import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { darken } from 'polished'
import { useContext } from 'react'
import { useCurrencyBalance } from 'state/connection/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { RowBetween } from '../Row'
import uImage from './7e7ris.gif'

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.deprecated_text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0.75rem 1rem 0 1rem;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.deprecated_text2)};
  }
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.deprecated_bg2};
  z-index: 1;
`

const Container = styled.div`
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.deprecated_bg2};
  background-color: ${({ theme }) => theme.deprecated_bg1};
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.75rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '16px')};
`

const StyledBalanceMax = styled.button`
  height: 28px;
  background-color: ${({ theme }) => theme.deprecated_primary5};
  border: 1px solid ${({ theme }) => theme.deprecated_primary5};
  border-radius: 0.5rem;
  font-size: 0.875rem;

  font-weight: 500;
  cursor: pointer;
  margin-right: 0.5rem;
  color: ${({ theme }) => theme.deprecated_primaryText1};
  :hover {
    border: 1px solid ${({ theme }) => theme.deprecated_primary1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.deprecated_primary1};
    outline: none;
  }

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToExtraSmall`
  margin-right: 0.5rem;
  `};
`

export const GameCardBGImage = styled.span<{ desaturate?: boolean }>`
  background: url(${uImage});
  width: 255px;
  height: 185px;
  position: relative;
  border-radius: 12px;
  user-select: none;
  display: flex;
  margin: 25px auto;
  scale: 1.25;
  ${({ desaturate }) => desaturate && `filter: saturate(0)`}
`

interface StakeInputPanelProps {
  currency?: Currency | null
  hideInput?: boolean
  id: string
  showMaxButton: boolean
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
}

export default function TetrisPanel({ currency, id, showMaxButton, value, onMax, onUserInput }: StakeInputPanelProps) {
  const { account } = useWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useContext(ThemeContext)

  return (
    <InputPanel id={id}>
      <Container>
        <LabelRow>
          <RowBetween>
            {account ? (
              <ThemedText.DeprecatedBody
                onClick={onMax}
                color={theme.deprecated_text2}
                fontWeight={500}
                fontSize={14}
                style={{ display: 'inline', cursor: 'pointer' }}
              >
                {!!currency && selectedCurrencyBalance ? 'Rewards: ' + selectedCurrencyBalance?.toSignificant(6) : ' -'}
              </ThemedText.DeprecatedBody>
            ) : null}
          </RowBetween>
        </LabelRow>
        <GameCardBGImage>⑦</GameCardBGImage>
      </Container>
    </InputPanel>
  )
}
