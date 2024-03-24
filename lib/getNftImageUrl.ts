import { ethers } from 'ethers';
import { JsonRpcProvider } from "ethers/providers";

// Define an interface for the metadata to ensure type safety.
interface NFTMetadata {
  image: string;
}

/**
 * Fetches the image URL of an NFT.
 * 
 * @param contractAddress - The address of the NFT contract.
 * @param tokenId - The token ID of the NFT.
 * @returns A promise that resolves to the image URL of the NFT.
 */
async function fetchNFTImageUrl(
  contractAddress: string,
  tokenId: string,
): Promise<string> {
  // Provider URL and Contract ABI should be predefined or configured externally
  const providerUrl = 'YOUR_JSON_RPC_PROVIDER_URL'; // e.g., Infura or Alchemy endpoint
  const contractABI = [
    // Minimal ABI to interact with ERC-721 tokenURI function
    'function tokenURI(uint256 tokenId) external view returns (string memory)',
  ];

  const provider = new JsonRpcProvider(
    process.env.NEXT_PUBLIC_PROVIDER
  );
  // Initialize the provider

  // Create a contract instance
  const nftContract = new ethers.Contract(contractAddress, contractABI, provider);

  // Call the tokenURI function
  const tokenURI = await nftContract.tokenURI!(tokenId);
  console.log(`Token URI: ${tokenURI}`);

  // Assuming the tokenURI is a direct URL.
  // Note: If the tokenURI returns an IPFS URI, you'll need to handle it accordingly.
  const response = await fetch(tokenURI); // Ensure fetch is available in your environment
  const metadata: NFTMetadata = await response.json();

  console.log("metadata---->",metadata)

  // Return the image URL from metadata
  return metadata.image;
}

export default fetchNFTImageUrl;
