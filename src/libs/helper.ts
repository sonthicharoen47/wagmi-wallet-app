import { Address } from "viem"

export const shortString = (_addrs: Address) => {
  return `${_addrs.slice(0, 6)}...${_addrs.slice(-6)}`
}
