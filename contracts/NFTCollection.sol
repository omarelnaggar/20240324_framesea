// SPDX-License-Identifier: MIT
// 2024-03-24 Omar: Originally clonsed from https://github.com/HugoBrunet13/NFT-Marketplace-Auction/tree/main

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTCollection is ERC721 {
    struct NFT {
        string name;
        string URI;
    }

    event Mint(uint256 index, address indexed mintedBy);

    NFT[] public allNFTs;

    constructor() ERC721("NFT Collection", "NFTC") {}

    // Mint a new NFT for Sale
    function mintNFT(
        string memory _nftName,
        string memory _nftURI
    ) external returns (uint256) {
        allNFTs.push(NFT({name: _nftName, URI: _nftURI}));

        uint256 index = allNFTs.length - 1;

        _safeMint(msg.sender, index);

        emit Mint(index, msg.sender);
        return index;
    }

    function transferNFTFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual returns (bool) {
        safeTransferFrom(from, to, tokenId);
        return true;
    }

    //function tokenURI(uint256 tokenId) public view virtual override returns (string memory){
    //    return allNFTs[tokenId].URI;
    //}

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory baseURI = allNFTs[tokenId].URI;
        return bytes(baseURI).length > 0 ? string.concat(baseURI, Strings.toString(tokenId)) : "";
    }
}
