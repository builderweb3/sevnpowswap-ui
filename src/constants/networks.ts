import { JsonRpcProvider } from '@ethersproject/providers'

import { SupportedChainId } from './chains'

const INFURA_KEY = process.env.REACT_APP_INFURA_KEY
if (typeof INFURA_KEY === 'undefined') {
  throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
}

export const MAINNET_PROVIDER = new JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/2wngR8Qeij_bqaoy4VOPgdVhOfNvIDvE`
)

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const RPC_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://eth-mainnet.g.alchemy.com/v2/2wngR8Qeij_bqaoy4VOPgdVhOfNvIDvE`,
  [SupportedChainId.ETHW]: `https://mainnet.ethereumpow.org`,
  [SupportedChainId.GOERLI]: `https://goerli.infura.io/v3/${INFURA_KEY}`,
}
