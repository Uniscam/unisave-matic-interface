import React, { useState } from 'react'
import Modal from '../Modal'
import { AutoColumn, ColumnCenter } from '../Column'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { DataCard, CardSection, Break } from '../earn/styled'
import { RowBetween } from '../Row'
import { TYPE, ExternalLink, CloseIcon, CustomLightSpinner, UniTokenAnimated } from '../../theme'
import { ButtonPrimary } from '../Button'
import { useClaimCallback, useUserUnclaimedAmount, useUserHasAvailableClaim } from '../../state/claim/hooks'
import tokenLogo from '../../assets/images/token-logo.png'
import Circle from '../../assets/images/blue-loader.svg'
import { Text } from 'rebass'
import AddressInputPanel from '../AddressInputPanel'
import useENS from '../../hooks/useENS'
import { useActiveWeb3React } from '../../hooks'
import { isAddress } from 'ethers/lib/utils'
import Confetti from '../Confetti'
import { CardNoise, CardBGImage, CardBGImageSmaller } from '../earn/styled'
import { useIsTransactionPending } from '../../state/transactions/hooks'
import { TokenAmount } from '@unisave/unisave-matic-sdk'
import { getBscScanLink, shortenAddress } from '../../utils'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #25183e 0%, #0d4747 100%);
`

const ConfirmOrLoadingWrapper = styled.div<{ activeBG: boolean }>`
  width: 100%;
  padding: 24px;
  position: relative;
  background: ${({ activeBG }) =>
    activeBG &&
    'radial-gradient(76.02% 75.41% at 1.84% 0%, rgba(255, 0, 122, 0.2) 0%, rgba(33, 114, 229, 0.2) 100%), #FFFFFF;'};
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

export default function AddressClaimModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const { chainId } = useActiveWeb3React()

  const { t } = useTranslation()

  // state for smart contract input
  const [typed, setTyped] = useState('')
  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // monitor for third party recipient of claim
  const { address: parsedAddress } = useENS(typed)

  // used for UI loading states
  const [attempting, setAttempting] = useState<boolean>(false)

  // monitor the status of the claim from contracts and txns
  const { claimCallback } = useClaimCallback(parsedAddress)
  const unclaimedAmount: TokenAmount | undefined = useUserUnclaimedAmount(parsedAddress)

  // check if the user has something available
  const hasAvailableClaim = useUserHasAvailableClaim(parsedAddress)

  const [hash, setHash] = useState<string | undefined>()

  // monitor the status of the claim from contracts and txns
  const claimPending = useIsTransactionPending(hash ?? '')
  const claimConfirmed = hash && !claimPending

  // use the hash to monitor this txn

  function onClaim() {
    setAttempting(true)
    claimCallback()
      .then(hash => {
        setHash(hash)
      })
      // reset modal and log error
      .catch(error => {
        setAttempting(false)
        console.log(error)
      })
  }

  function wrappedOnDismiss() {
    setAttempting(false)
    setHash(undefined)
    setTyped('')
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      <Confetti start={Boolean(isOpen && claimConfirmed && attempting)} />
      {!attempting && (
        <ContentWrapper gap="lg">
          <ModalUpper>
            <CardBGImage />
            <CardNoise />
            <CardSection gap="md">
              <RowBetween>
                <TYPE.white fontWeight={500}>{t('claimScamToken')}</TYPE.white>
                <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="white" />
              </RowBetween>
              <TYPE.white fontWeight={700} fontSize={36}>
                {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} SCAM
              </TYPE.white>
            </CardSection>
            <Break />
          </ModalUpper>
          <AutoColumn gap="md" style={{ padding: '1rem', paddingTop: '0' }} justify="center">
            <TYPE.subHeader fontWeight={500}>
              {t(
                'enter-an-address-to-trigger-a-scam-claim-if-the-address-has-any-claimable-scam-it-will-be-sent-to-them-on-submission'
              )}
            </TYPE.subHeader>
            <AddressInputPanel value={typed} onChange={handleRecipientType} />
            {parsedAddress && !hasAvailableClaim && (
              <TYPE.error error={true}>{t('address-has-no-available-claim')}</TYPE.error>
            )}
            <ButtonPrimary
              disabled={!isAddress(parsedAddress ?? '') || !hasAvailableClaim}
              padding="16px 16px"
              width="100%"
              borderRadius="12px"
              mt="1rem"
              onClick={onClaim}
            >
              {t('claim')} SCAM
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {(attempting || claimConfirmed) && (
        <ConfirmOrLoadingWrapper activeBG={true}>
          <CardNoise />
          <CardBGImageSmaller desaturate />
          <RowBetween>
            <div />
            <CloseIcon onClick={wrappedOnDismiss} style={{ zIndex: 99 }} stroke="black" />
          </RowBetween>
          <ConfirmedIcon>
            {!claimConfirmed ? (
              <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
            ) : (
              <UniTokenAnimated width="72px" src={tokenLogo} />
            )}
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <TYPE.largeHeader fontWeight={600} color="black">
                {claimConfirmed ? t('claimed') : t('claiming')}
              </TYPE.largeHeader>
              {!claimConfirmed && (
                <Text fontSize={36} color={'#fe2500'} fontWeight={800}>
                  {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} SCAM
                </Text>
              )}
              {parsedAddress && (
                <TYPE.largeHeader fontWeight={600} color="black">
                  {t('for')} {shortenAddress(parsedAddress)}
                </TYPE.largeHeader>
              )}
            </AutoColumn>
            {claimConfirmed && (
              <>
                <TYPE.subHeader fontWeight={500} color="black">
                  <span role="img" aria-label="party-hat">
                    🎉{' '}
                  </span>
                  {t('welcomeToTeamUnicorn')} :){' '}
                  <span role="img" aria-label="party-hat">
                    🎉
                  </span>
                </TYPE.subHeader>
              </>
            )}
            {attempting && !hash && (
              <TYPE.subHeader color="black">{t('confirm-this-transaction-in-your-wallet')}</TYPE.subHeader>
            )}
            {attempting && hash && !claimConfirmed && chainId && hash && (
              <ExternalLink href={getBscScanLink(chainId, hash, 'transaction')} style={{ zIndex: 99 }}>
                {t('viewTransactionOnEtherscan')}
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
