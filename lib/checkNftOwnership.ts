import { BigNumberish, ethers } from "ethers";
import { JsonRpcProvider } from "ethers/providers";


interface ERC721Contract {
  ownerOf(tokenId: BigNumberish): Promise<string>;
}
// Function to check NFT ownership for a given wallet
export async function checkNFTOwnership(
  tokenId: string,
  walletAddress: string,
  nftContractAddress:string
): Promise<boolean> {
  try {
    const provider = new JsonRpcProvider(
      process.env.NEXT_PUBLIC_PROVIDER
    );

    const contract: ERC721Contract = new ethers.Contract(nftContractAddress as string, [
      "function ownerOf(uint256 tokenId) external view returns (address)",
    ], provider) as unknown as ERC721Contract;
    
    const owner = await contract.ownerOf(tokenId);
    return owner.toLowerCase() === walletAddress.toLowerCase();
  } catch (error) {
    console.error("Error checking NFT ownership:", error);
    return false;
  }
}