import { AutoColumn } from 'components/Column'
import { CardBGImage, CardSection, DataCard } from 'components/earn/styled'
import { RowBetween } from 'components/Row'
import { usePowBarStats } from 'state/single-stake/hooks'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'

const Card = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, rgb(3, 244, 236) 0%, rgba(231, 51, 255, 0.76) 100%);
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

export default function DevelopmentGames() {
  const { triToXTRIRatio } = usePowBarStats()
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
  const aprText = <LargeHeaderWhite>In Development</LargeHeaderWhite>

  const triToXTRIRatioFormatted = triToXTRIRatio?.toFixed(6)
  const ratioText = triToXTRIRatioFormatted == null ? 'Loading...' : `1 Game = Not Available`

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
