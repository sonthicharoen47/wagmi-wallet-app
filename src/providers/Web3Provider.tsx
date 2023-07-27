import useWalletContext from "@hooks/useWalletContext"
import React from "react"

const Web3Context = React.createContext<
  ReturnType<typeof useWalletContext> | undefined
>(undefined)

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const context = useWalletContext()
  return <Web3Context.Provider value={context}>{children}</Web3Context.Provider>
}

export const useWeb3Provider = () => {
  const context = React.useContext(Web3Context)
  return { ...context }
}
