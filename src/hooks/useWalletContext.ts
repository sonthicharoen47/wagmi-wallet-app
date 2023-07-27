import React from "react"
import { useAccount, useConnect } from "wagmi"
import {
  Address,
  createPublicClient,
  createWalletClient,
  http,
  custom,
  WalletClient,
} from "viem"
import { polygonMumbai, bscTestnet } from "viem/chains"

const polygonPublicClient = createPublicClient({
  chain: polygonMumbai,
  transport: http(`https://polygon-mumbai-bor.publicnode.com`),
})

const bscPublicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(),
  batch: {
    multicall: true,
  },
})

const useWalletContext = () => {
  const [walletAddrs, setWalletAddrs] = React.useState<Address | undefined>(
    undefined
  )
  const windowRef = React.useRef<boolean>(false)
  const [walletClient, setWalletClient] = React.useState<WalletClient>()

  const { address } = useAccount()

  React.useEffect(() => {
    let load = false
    if (!load) setWalletAddrs(address)
  }, [address])

  const connectWalletClient = React.useCallback(async () => {}, [])

  React.useEffect(() => {
    if (!windowRef.current && window.ethereum && walletAddrs) {
      windowRef.current = true
      console.log("set wallet here")
      const polygonWalletClient = createWalletClient({
        account: walletAddrs,
        chain: polygonMumbai,
        transport: custom(window.ethereum),
      })
      setWalletClient(polygonWalletClient)
    }
  }, [walletAddrs])

  React.useEffect(() => {
    let load = false
    if (!load && walletClient) {
      console.log(walletClient)
    }
    return () => {
      load = true
    }
  }, [walletClient])

  return {
    walletAddrs,
    bscPublicClient,
    polygonPublicClient,
    connectWalletClient,
    walletClient,
  }
}

export default useWalletContext
