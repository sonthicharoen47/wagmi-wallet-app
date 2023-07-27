import { useWeb3Provider } from "@providers/Web3Provider"
import React from "react"
import { Address, getContract, formatEther } from "viem"
import ERC20ABI from "@constants/abis/ERC20.json"
import { STATIC_CONFIGS } from "@constants"

const useERC20 = ({ addrs }: { addrs: Address | undefined }) => {
  const { polygonPublicClient, walletClient } = useWeb3Provider()

  const contract = getContract({
    address: STATIC_CONFIGS.CONTRACT.ERC20 as Address,
    abi: ERC20ABI,
    publicClient: polygonPublicClient,
  })

  const getBalance = React.useCallback(async () => {
    let _result: string | undefined
    if (addrs) {
      let _balance: bigint | undefined = await polygonPublicClient?.getBalance({
        address: addrs,
      })
      if (_balance) _result = formatEther(_balance)
    }
    return _result
  }, [polygonPublicClient, addrs])

  const getBalanceOf = React.useCallback(async () => {
    let _result: string | undefined
    if (addrs) {
      let _balance = (await contract.read.balanceOf([addrs])) as
        | bigint
        | undefined
      if (_balance) _result = formatEther(_balance)
    }
    return _result
  }, [addrs, contract.read])

  const transferCoin = React.useCallback(
    async (_to: string, _amont: bigint) => {
      if (polygonPublicClient && walletClient) {
        const { request } = await polygonPublicClient.simulateContract({
          account: addrs,
          address: STATIC_CONFIGS.CONTRACT.ERC20 as Address,
          abi: ERC20ABI,
          functionName: "transfer",
          args: [_to, _amont],
        })
        const result = await walletClient.writeContract(request)
        console.log("result", result)
        const transaction = await polygonPublicClient.waitForTransactionReceipt(
          {
            hash: result,
          }
        )
        return transaction
      }
    },
    [addrs, polygonPublicClient, walletClient]
  )

  return {
    getBalance,
    getBalanceOf,
    transferCoin,
  }
}

export default useERC20
