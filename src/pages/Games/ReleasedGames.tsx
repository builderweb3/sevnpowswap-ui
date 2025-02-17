import { AutoColumn } from 'components/Column'
import { CardBGImage, CardSection, DataCard } from 'components/earn/styled'
import { RowBetween } from 'components/Row'
import { usePowBarStats } from 'state/single-stake/hooks'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'

const Card = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, rgb(255, 0, 238) 0%, rgba(255, 140, 0, 0.89) 100%);
`

const MediumHeaderWhite = styled(ThemedText.DeprecatedMediumHeader)`
  color: white;
`
const SubHeaderWhite = styled(ThemedText.DeprecatedSubHeader)`
  color: white;
`
const LargeHeaderWhite = styled(ThemedText.DeprecatedLargeHeader)`
  color: white;
`

export default function ReleasedGames() {
  const { gameprice, theprice } = usePowBarStats()

  //const apr = useFetchTriBarAPR()
  // @TODO Use this after prod APR is ready
  // const aprText = (
  //     <>
  //         <LargeHeaderWhite>
  //             {apr == null
  //                 ? 'Loading...'
  //                 : `${apr?.toFixed(2)}%`}
  //         </LargeHeaderWhite>
  //         <SubHeaderWhite>
  //             Yesterday's APR
  //         </SubHeaderWhite>
  //     </>
  // );
  const aprText = <LargeHeaderWhite>Released</LargeHeaderWhite>

  let multi
  if (Number(theprice?.toFixed(0)) > 1000000) {
    multi = 100000
  } else if (Number(theprice?.toFixed(0)) <= 999999.99 && Number(theprice?.toFixed(0)) > 10000) {
    multi = 10000
  } else if (Number(theprice?.toFixed(0)) <= 9999.99 && Number(theprice?.toFixed(0)) > 100) {
    multi = 100
  } else if (Number(theprice?.toFixed(0)) <= 99.99 && Number(theprice?.toFixed(0)) > 10) {
    multi = 10
  } else if (Number(theprice?.toFixed(0)) <= 9.99 && Number(theprice?.toFixed(0)) >= 0) {
    multi = 1
  } else {
    multi = 100000
  }

  const unparsedPrice = Number(theprice?.toFixed(0)) / multi
  const triToXTRIRatioFormatted = Math.round(unparsedPrice) * multi
  const ratioText =
    triToXTRIRatioFormatted == null ? 'Loading...' : `1 Game = 0.015 EthW or ${triToXTRIRatioFormatted} 7evn`

  return (
    <Card>
      <CardSection>
        <AutoColumn gap="md">
          <RowBetween>
            <AutoColumn gap="sm" justify="start">
              <MediumHeaderWhite fontWeight={600}>7evn Games</MediumHeaderWhite>
              <SubHeaderWhite>{ratioText}</SubHeaderWhite>
            </AutoColumn>
            <AutoColumn gap="sm" justify="end">
              {aprText}
            </AutoColumn>
          </RowBetween>
        </AutoColumn>
      </CardSection>
      <CardBGImage />
    </Card>
  )
}
