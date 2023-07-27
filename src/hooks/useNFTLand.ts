import { STATIC_CONFIGS } from "@constants"
import React from "react"
import { Address, getContract } from "viem"
import NFTLANDABI from "@constants/abis/NFTLand.json"
import { useWeb3Provider } from "@providers/Web3Provider"

const useNFTLand = () => {
  const { polygonPublicClient } = useWeb3Provider()

  const contract = getContract({
    address: STATIC_CONFIGS.CONTRACT.NFT_LAND as Address,
    abi: NFTLANDABI.abi,
    publicClient: polygonPublicClient,
  })

  const getOwnerOfLand = React.useCallback(
    async (_token: string) => {
      return (await contract.read.ownerOf([_token])) as string | undefined
    },
    [contract.read]
  )

  return { getOwnerOfLand }
}

export default useNFTLand
