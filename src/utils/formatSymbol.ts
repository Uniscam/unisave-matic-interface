import { Currency, ETHER, ChainId } from '@unisave/unisave-matic-sdk'

export const formatSymbol = (currency?: Currency | null, chainId: ChainId = ChainId.MAINNET) => {
  if (!currency) return ''
  if (currency === ETHER) return currency.toDisplayableSymbol(chainId)
  return currency.symbol
}

export default formatSymbol
