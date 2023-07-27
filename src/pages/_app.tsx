import "@styles/globals.css"
import type { AppProps } from "next/app"
import { jsonRpcProvider } from "@wagmi/core/providers/jsonRpc"
import { InjectedConnector } from "@wagmi/core/connectors/injected"
import { MetaMaskConnector } from "@wagmi/core/connectors/metaMask"
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet"
import { WalletConnectConnector } from "wagmi/connectors/walletConnect"

import { configureChains, createConfig, WagmiConfig } from "wagmi"
import { arbitrum, mainnet, polygon } from "wagmi/chains"
import { Web3Provider } from "@providers/Web3Provider"

const { chains, publicClient } = configureChains(
  [polygon],
  [
    jsonRpcProvider({
      rpc: () => ({
        http: `https://polygon-mumbai-bor.publicnode.com`,
      }),
    }),
  ]
)

const config = createConfig({
  connectors: [
    new MetaMaskConnector({ chains }),
    new InjectedConnector({
      options: {
        name: "OKX Wallet",
        getProvider: () =>
          typeof window !== "undefined" && window.okxwallet
            ? window.okxwallet
            : undefined,
        shimDisconnect: false,
      },
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "http://localhost:3000",
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId: "3e2ef194f8a24bfcd164adbda150d083",
      },
    }),
  ],
  autoConnect: false,
  publicClient,
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <WagmiConfig config={config}>
        <Web3Provider>
          <Component {...pageProps} />
        </Web3Provider>
      </WagmiConfig>
    </>
  )
}
