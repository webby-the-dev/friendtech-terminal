import { ethers } from "ethers";
import { contractABI } from "./contractABI";

const baseNetworkWebsocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_PROVIDER;
const contractAddress = "0xCF205808Ed36593aa40a44F10c7f7C2F67d4A4d4";

const provider = new ethers.WebSocketProvider(baseNetworkWebsocketUrl!);

export const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  provider
);
let contractWithSigner = undefined;

export const setupWallet = async (privateKey: string) => {
  return new ethers.Wallet(privateKey, provider);
};

export const setupContract = async (privateKey: string) => {
  const wallet = await setupWallet(privateKey);
  contractWithSigner = contract.connect(wallet);
};

export const buyShares = async (
  subjectAddress: string,
  sharesToBuy: number,
  toast: any,
  callback: any
) => {
  const qty = BigInt(sharesToBuy);
  const buyPrice = await contractWithSigner!.getBuyPriceAfterFee(
    subjectAddress,
    qty
  );

  try {
    const tx = await contractWithSigner!.buyShares(subjectAddress, qty, {
      value: buyPrice,
    });
    const receipt = await tx.wait();
    console.log(`Transaction successful with hash: ${receipt.hash}`);

    setTimeout(() => {
      callback();
      toast({
        title: "Success",
        description: "Succesfully bought shares",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }, 5000);
  } catch (err) {
    if (err instanceof Error) {
      toast({
        title: "Error",
        description: `Failed to buy shares for ${subjectAddress}: ${err.message}`,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    console.error(`Failed to buy shares for ${subjectAddress}`, err);
  }
};

export const sellShares = async (
  subjectAddress: string,
  sharesToSell: number,
  toast: any,
  callback: any
) => {
  const qty = BigInt(sharesToSell);

  try {
    const tx = await contractWithSigner!.sellShares(subjectAddress, qty, {
      value: 0,
    });
    const receipt = await tx.wait();
    console.log(`Transaction successful with hash: ${receipt.hash}`);

    setTimeout(() => {
      callback();
      toast({
        title: "Success",
        description: "Succesfully sold shares",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
    }, 5000);
  } catch (err) {
    if (err instanceof Error) {
      toast({
        title: "Error",
        description: `Failed to sell shares for ${subjectAddress}: ${err.message}`,
        status: "error",
        duration: 9000,
        isClosable: true,
      });
    }
    console.error(`Failed to sell shares for ${subjectAddress}`, err);
  }
};
