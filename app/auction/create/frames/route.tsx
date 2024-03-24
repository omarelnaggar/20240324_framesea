/* eslint-disable react/jsx-key */
import { createFrames, Button } from "frames.js/next";
import { getAddressForFid } from "frames.js"
import { currentURL } from "../../../utils";
import { checkNFTOwnership } from "../../../../lib/checkNftOwnership";
import { supabase } from '../../../../lib/supabaseClient';
import {
  getPreviousFrame,
  validateActionSignature,
} from "frames.js/next/server";
import { parseOpenseaUrl } from "../../../../lib/parseUrl";

const frames = createFrames({
  basePath: "/auction/create/frames",
});

const handleRequest = frames(async (ctx) => {
  const previousFrame = getPreviousFrame(ctx.searchParams);
  const validMessage = await validateActionSignature(previousFrame.postBody);
  console.log("validMessage?.data?.frameActionBody?.castId?.fid",validMessage?.data?.frameActionBody?.castId?.fid); // 1214

  console.log("ctx.searchParams.stage ", ctx.searchParams.stage)
let userWalletAddress: string | null = '';
  if(ctx.message?.requesterFid){
    userWalletAddress = await getAddressForFid({
    fid: Number(ctx.message?.requesterFid),
  });
  console.log("ctx.message",ctx.message)
  console.log(userWalletAddress)
  }
  const url = ctx.message?.inputText

  const backUrl = currentURL("/");

  if(ctx.message?.inputText && ctx.searchParams.stage === 'bid'){
    const regex = /^https:\/\/opensea\.io\/assets\/([a-z]+)\/([^\/]+)\/([^\/]+)/;

    const url = ctx.message?.inputText
    const matches = ctx.message?.inputText.match(regex);
    if (matches && matches.length === 4) {
      const platform = matches[1];
      const NftContractAddress = matches[2];
      const NftId = matches[3];
  
      console.log("Platform:", platform);
      console.log("NFT Contract Address:", NftContractAddress);
      console.log("NFT ID:", NftId);
      let nftOwned = false;
      if(userWalletAddress){
        nftOwned = await checkNFTOwnership(NftId, userWalletAddress, NftContractAddress);
      }
      console.log("userWalletAddress", userWalletAddress)
      console.log("nftOwned", nftOwned)
      if(nftOwned){
        return {
          image: (
            <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
              <div tw="flex flex-row">
                <div tw="flex flex-col items-center justify-center p-4">
                  <h1 tw="text-5xl font-bold tracking-tighter">You own the NFT</h1>
                  <div tw="flex flex-col">
                    <h1 tw="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">Enter Select minimum bid</h1>
                    <h1 tw="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">AUCTION!! 🎉🔨</h1>
                  </div>
                </div>
              </div>
            </div>
          ),
          imageOptions:{
            aspectRatio: "1.91:1"
          },
          buttons: [
            <Button
              action="post"
              target={backUrl.origin}
            >
              Back
            </Button>,
            <Button action="post"
                target={{ query: { url: url, stage: "auction", amount: ctx.message?.inputText } }}
            >
              Enter min bid
            </Button>,
          ],
          textInput: "Enter min bid amount",
        };
      } else {
        return {
          image: (
            <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
              <div tw="flex flex-row">
              <div tw="flex flex-col items-center justify-center p-4">
              <h1 tw="text-5xl font-bold tracking-tighter">You dont own this NFT</h1>
                 </div>
                </div>
            </div>
          ),
          imageOptions:{
            aspectRatio: "1.91:1"
          },
          buttons: [
            <Button
              action="post"
              target={backUrl.origin}
            >
              Home
            </Button>,
          ]
        };
      }
      
  } else {
      return{
        image:(
        <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
         <div tw="flex flex-row">
            <div tw="flex flex-col items-center justify-center p-4">
              <h1 tw="text-5xl font-bold tracking-tighter">Error parsing Url. Enter again</h1>
            </div>
          </div>
        </div>),
         imageOptions:{
          aspectRatio: "1.91:1"
        },
        buttons: [
          <Button
            action="post"
            target={backUrl.origin}
          >
            Home
          </Button>,
        ]
      }
  }
  } else if (ctx.searchParams.stage === "auction") {
        const amount = Number(ctx.message?.inputText);
        const minBidIncrement = 0; // Assuming a default value, adjust as necessary
        const endTimeInMin = 5;
        const url = ctx.searchParams.url as string;
        const { platform, NftContractAddress, NftId } = parseOpenseaUrl(url);
        const fid = Number(ctx.message?.requesterFid);


        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + endTimeInMin * 60000);

        const { data, error } = await supabase
          .from('auctions')
          .insert([
            {
              minbid: amount,
              minincrement: minBidIncrement,
              starttime: startTime,
              endtime: endTime,
              nftcontract: NftContractAddress,
              nftid: NftId,
              fid: fid
            },
          ]).select() as { data: any[] | null; error: any };;
        if (error) {
          console.error('Error inserting auction data:', error);
          return {
            image: (
              <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
                <div tw="flex flex-row">
                <div tw="flex flex-col items-center justify-center p-4">
                <h1 tw="text-5xl font-bold tracking-tighter">Error creating Auction!</h1>
                   </div>
                  </div>
              </div>
            ),
            buttons: [
              <Button
                action="post"
                target={backUrl.origin}
              >
                Home
              </Button>
            ],
         }
        }
      console.log('Inserted auction data:', data);
      const insertedAuctionID = data && data.length && data[0]?.auctionid; // Assuming the insert was successful and we have the data
      console.log('Inserted auction ID:', insertedAuctionID);
        return {
          image: (
            <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
              <div tw="flex flex-row">
                <div tw="flex flex-col items-center justify-center p-4">
                  <h1 tw="text-5xl font-bold tracking-tighter">Auction Created Successfully!</h1>
                  <p tw="text-xl">Auction ID: {insertedAuctionID}</p>
                </div>
              </div>
            </div>
          )
      }
}

  return {
    image: (
      <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
        <div tw="flex flex-row">
        <div tw="flex flex-col items-center justify-center p-4">
        <h1 tw="text-5xl font-bold tracking-tighter">Create Auction</h1>
          <div tw="flex flex-col">
            <h1 tw="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">1. Enter Open Sea NFT URL.</h1>
            <h1 tw="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">2. Select minimum bid</h1>
            <h1 tw="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">3. AUCTION!! 🎉🔨</h1>
            </div>
           </div>
          </div>
      </div>
    ),
    imageOptions:{
      aspectRatio: "1.91:1"
    },
    buttons: [
      <Button
        action="post"
        target={backUrl.origin}
      >
        Home
      </Button>,
      <Button action="post"
          target={{ query: { url: url,  stage:'bid' } }}
      >
        Enter min bid
      </Button>,
    ],
    textInput: "Enter Open Sea nft url",
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
