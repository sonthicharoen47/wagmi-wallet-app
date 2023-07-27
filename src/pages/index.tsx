import Image from "next/image"
import {
  Address,
  useAccount,
  useBalance,
  useConnect,
  useContractEvent,
  useContractRead,
  useContractWrite,
  useDisconnect,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi"
import { InjectedConnector } from "wagmi/connectors/injected"
import { Web3Button } from "@web3modal/react"
import React from "react"
import { useWeb3Provider } from "@providers/Web3Provider"
import useERC20 from "@hooks/useERC20"
import ERC20ABI from "@constants/abis/ERC20.json"
import NFTLANDABI from "@constants/abis/NFTLand.json"
import { STATIC_CONFIGS } from "@constants"
import {
  TransactionReceipt,
  decodeEventLog,
  encodeEventTopics,
  formatEther,
  parseEther,
  parseGwei,
} from "viem"
import useNFTLand from "@hooks/useNFTLand"
import { shortString } from "@libs/helper"

type TTxLogs = {
  eventName: string
  from: Address
  to: Address
  value: string
}

export default function Home() {
  const { isConnected } = useAccount()
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect()
  const { disconnect } = useDisconnect()
  const { walletAddrs, connectWalletClient, walletClient } = useWeb3Provider()
  const {
    data,
    isError,
    isLoading: isBalanceLoading,
  } = useBalance({
    address: walletAddrs,
  })
  const { getBalance, getBalanceOf, transferCoin } = useERC20({
    addrs: walletAddrs,
  })
  const { getOwnerOfLand } = useNFTLand()

  const [ready, setReady] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string>("")
  const [balance, setBalance] = React.useState<string | undefined>(undefined)
  const [balanceOf, setBalanceOf] = React.useState<string | undefined>(
    undefined
  )
  const [NFTToken, setNFTToken] = React.useState<string>("11900161")
  const [searchLand, setSearchLand] = React.useState<boolean>(false)
  const [NFTOwner, setNFTOwner] = React.useState<string | undefined>(undefined)

  const [toAddrs, setToAddrs] = React.useState<string>(
    "0x6C8422739dbEfaF6c46dbdAd9802799Fe0ab9848"
  )
  const [coinAmount, setCoinAmount] = React.useState<number>(1)

  const [txLogs, setTxLogs] = React.useState<{
    eventName: string
    args: {
      [key: string]: bigint | Address
    }
  }>()

  const { config } = usePrepareContractWrite({
    address: STATIC_CONFIGS.CONTRACT.ERC20 as Address,
    abi: ERC20ABI,
    functionName: "transfer",
    args: [toAddrs, parseEther(coinAmount.toString())],
  })

  const {
    data: sendNAKA,
    isLoading: sendIsLoading,
    isSuccess,
    write,
  } = useContractWrite(config)

  const waitForTransaction = useWaitForTransaction({
    hash: sendNAKA?.hash,
  })

  const encoderTopic = React.useCallback(
    (_tx: TransactionReceipt | undefined) => {
      if (!_tx) return undefined
      const _topic = encodeEventTopics({
        abi: ERC20ABI,
        eventName: "Transfer",
      })
      const _logs = _tx.logs.find((log) =>
        log.topics.find((t) => t === _topic[0])
      )
      if (_logs) {
        const _decode = decodeEventLog({
          abi: ERC20ABI,
          data: _logs.data,
          topics: _logs.topics,
        })
        setTxLogs(_decode)
      }
    },
    []
  )

  React.useEffect(() => {
    let load = false
    if (!load && waitForTransaction.isSuccess) {
      encoderTopic(waitForTransaction.data)
    }
    return () => {
      load = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitForTransaction])

  const onClearNFTToken = React.useCallback(() => {
    setNFTToken("")
    setSearchLand(false)
    setNFTOwner(undefined)
  }, [])

  const onSubmitNFTToken = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setSearchLand(true)
      if (getOwnerOfLand && NFTToken) {
        const _owner = await getOwnerOfLand(NFTToken)
        setNFTOwner(_owner)
      }
    },
    [NFTToken, getOwnerOfLand]
  )

  const {
    data: erc20Data,
    isError: erc20IsError,
    isLoading: erc20IsLoading,
  } = useContractRead({
    address: STATIC_CONFIGS.CONTRACT.ERC20 as Address,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: [walletAddrs],
    enabled: !!walletAddrs,
  })

  const {
    data: nftLandData,
    isError: nftLandIsError,
    isLoading: nftLandIsLoading,
  } = useContractRead({
    address: STATIC_CONFIGS.CONTRACT.NFT_LAND as Address,
    abi: NFTLANDABI.abi,
    functionName: "ownerOf",
    args: [NFTToken],
    enabled: !!(searchLand && NFTToken),
  })

  const onDisconnect = React.useCallback(() => {
    setBalance(undefined)
    setBalanceOf(undefined)
    disconnect()
  }, [disconnect])

  const getViem = React.useCallback(async () => {
    const [_getBalance, _balanceOf] = await Promise.all([
      getBalance(),
      getBalanceOf(),
    ])
    setBalance(_getBalance)
    setBalanceOf(_balanceOf)
  }, [getBalance, getBalanceOf])

  React.useEffect(() => {
    let load = false
    if (!load) setReady(true)
    return () => {
      load = true
    }
  }, [])

  React.useEffect(() => {
    let load = false
    if (!load && error?.message) {
      setErrorMessage(error?.message)
    }
    return () => {
      load = true
      setTimeout(() => setErrorMessage(""), 5000)
    }
  }, [error])

  React.useEffect(() => {
    let load = false
    if (!load && searchLand) {
      setSearchLand(false)
    }
    return () => {
      load = true
    }
  }, [searchLand])

  React.useEffect(() => {
    let load = false
    if (!load && walletAddrs) {
      getViem()
    }
    return () => {
      load = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddrs])

  React.useEffect(() => {
    let load = false
    if (!load && !isConnected) {
      if (balance) setBalance(undefined)
      if (balanceOf) setBalanceOf(undefined)
    }
    return () => {
      load = true
    }
  }, [balance, balanceOf, isConnected])

  if (!ready) return <></>

  return (
    <main
      className={`flex min-h-screen w-screen flex-col gap-y-4 items-center justify-start p-20`}
    >
      <div
        className={`capitalize p-10 rounded w-full gap-y-10 flex flex-col items-center border border-slate-900`}
      >
        <h1 className="text-center font-bold uppercase text-red-600">
          connect wallet
        </h1>
        <div className="h-10">
          {isConnected
            ? `current address: ${walletAddrs}`
            : "please connect wallet"}
        </div>

        <div className="w-full flex flex-row gap-x-4 items-center justify-center">
          {connectors.map((connector) => (
            <button
              disabled={!connector.ready}
              key={connector.id}
              onClick={() => connect({ connector })}
              className="w-fit border border-slate-500 bg-slate-800 text-white rounded py-1 px-2"
            >
              {connector.name}
              {!connector.ready && " (unsupported)"}
              {isLoading &&
                connector.id === pendingConnector?.id &&
                " (connecting)"}
            </button>
          ))}
        </div>
        <div className="w-full flex flex-row h-10 items-center justify-center text-red-500">
          {errorMessage}
        </div>
        <div className="h-10">
          {isConnected ? (
            <button
              className="bg-black text-white rounded w-fit px-2 py-1 capitalize"
              onClick={() => onDisconnect()}
            >
              disconnect
            </button>
          ) : undefined}
        </div>
      </div>
      <div className="w-full h-96 grid grid-cols-2 gap-x-4">
        <div className="w-full gap-y-2 h-full border border-slate-900 rounded p-4 flex flex-col items-center justify-center">
          <h3 className="capitalize font-bold text-blue-600">read contract</h3>
          <form
            className="flex flex-row items-center gap-x-2"
            onSubmit={onSubmitNFTToken}
          >
            <h6 className="capitalize">land NFT token</h6>
            <input
              className="border border-black rounded pl-1"
              value={NFTToken}
              onChange={(e) => setNFTToken(e.target.value)}
            />
            <button
              type="submit"
              className="uppercase bg-blue-700 text-white px-2 py-1 rounded"
            >
              submit
            </button>
            <button
              type="button"
              className="uppercase bg-red-500 px-2 py-1 rounded text-white"
              onClick={() => onClearNFTToken()}
            >
              clear
            </button>
            <button
              type="button"
              className="uppercase bg-green-600 px-2 py-1 rounded text-white"
              onClick={() => setNFTToken("11900161")}
            >
              auto fill
            </button>
          </form>
          <div className="h-full w-full grid grid-cols-2 gap-x-2">
            <div className="p-1 w-full flex flex-col items-center rounded border border-red-600">
              <h4 className="capitalize font-bold">wagmi</h4>
              <div className="capitalize w-full flex flex-row items-center justify-start">
                wallet balance :{" "}
                {!isBalanceLoading && data
                  ? `${data?.formatted} ${data?.symbol}`
                  : "-"}
              </div>
              <div className="capitalize w-full flex flex-row ietms-center justify-start">
                balanceOf : {erc20Data ? formatEther(erc20Data as bigint) : "-"}
              </div>
              <div className="capitalize w-full flex flex-row ietms-center justify-start">
                NFT Land OwnerOf:{" "}
                {nftLandData ? shortString(nftLandData as Address) : "-"}
              </div>
            </div>
            <div className="p-1 w-full flex flex-col items-center rounded border border-purple-600">
              <h4 className="capitalize font-bold">viem</h4>
              <div className="w-full capitalize flex flex-row items-center justify-start">
                wallet balance : {balance ? balance : "-"}
              </div>
              <div className="capitalize w-full flex flex-row ietms-center justify-start">
                balanceOf : {balanceOf ? balanceOf : "-"}
              </div>
              <div className="capitalize w-full flex flex-row ietms-center justify-start">
                NFT Land OwnerOf:{" "}
                {NFTOwner ? shortString(NFTOwner as Address) : "-"}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full h-full border border-slate-900 relative p-4 flex flex-col gap-y-2 capitalize">
          <h3 className="font-bold text-yellow-600 capitalize text-center">
            write contract
          </h3>
          <div className="flex flex-row w-full gap-x-2 justify-center">
            <p>send </p>
            <input
              className="w-20 border rounded border-black pl-1"
              type="number"
              value={coinAmount}
              min={1}
              onChange={(e) => setCoinAmount(Number(e.target.value))}
            />
            <p>NAKA to </p>
            <input
              className="w-56 border rounded border-black pl-1"
              value={toAddrs}
              onChange={(e) => setToAddrs(e.target.value)}
            />
          </div>
          <div className="h-full w-full flex flex-col">
            <div className="h-40 w-full grid grid-cols-2 gap-2">
              <div className="border border-blue-600 rounded w-full flex gap-4 py-2 h-fit flex-col items-center">
                <h4 className="capitalize font-bold">wagmi</h4>
                <button
                  className={`px-2 py-1 rounded uppercase text-white ${
                    ready ? "bg-blue-600" : "bg-slate-600"
                  }`}
                  disabled={!write}
                  onClick={() => write?.()}
                >
                  send
                </button>
              </div>
              <div className="border border-red-600 rounded w-full h-fit flex flex-col gap-4 py-2 items-center">
                <h4 className="capitalize font-bold">viem</h4>
                <button
                  className={`px-2 py-1 rounded uppercase text-white ${
                    ready ? "bg-red-600" : "bg-slate-600"
                  }`}
                  onClick={async () => {
                    const _result = await transferCoin(
                      toAddrs,
                      parseEther(coinAmount.toString())
                    )
                    encoderTopic(_result)
                  }}
                >
                  send
                </button>
              </div>
            </div>
            <div className="w-full h-full border border-slate-800 p-2 flex flex-col items-center gap-y-1">
              <h6 className="capitalize text-center font-bold">Logs</h6>
              <div className="w-full flex flex-col items-start h-full border border-purple-700 rounded py-1 px-4">
                <p>
                  {txLogs?.eventName
                    ? `Event Name : ${txLogs.eventName}`
                    : undefined}
                </p>
                {txLogs?.args &&
                  Object.entries(txLogs.args).map(([key, value], index) => (
                    <div key={key}>
                      {key} :{" "}
                      {typeof value === "bigint" ? Number(value) : value}
                    </div>
                  ))}
              </div>
              <button
                type="button"
                className="uppercase bg-red-600 px-2 py-1 rounded text-white"
                onClick={() => setTxLogs({ eventName: "", args: {} })}
              >
                clear
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
