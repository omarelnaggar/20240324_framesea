import { createFrames, Button } from "frames.js/next";
import { supabase } from "../../../../lib/supabaseClient";
import fetchNFTImageUrl from '../../../../lib/getNftImageUrl';
import { currentURL } from "../../../utils";
const frames = createFrames({
  basePath: "/browse/nft/frames",
});

interface Auction {
  auctionid: string;
  endtime: string;
  nftcontract:string;
  nftid:string;
  minbid:string;
}

const fetchAuctionById = async (id: string) => {
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('auctionid', id)
    .single();

  if (error) {
    console.error('Error fetching auction:', error);
    return null;
  }

  return data;
};

const fetchHighestBid = async (auctionId: string): Promise<number | null> => {
  const { data, error } = await supabase
    .from('bids')
    .select('bidamount')
    .eq('auctionid', auctionId)
    .order('bidamount', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching highest bid:', error);
    return null;
  }

  return data ? data.bidamount : null;
};

function calculateTimeRemaining(endTime: string): string {
  const endTimeDate = new Date(endTime);
  const now = new Date();
  const timeRemaining = endTimeDate.getTime() - now.getTime();

  if (timeRemaining < 0) {
    return "Auction has ended";
  }

  // Convert timeRemaining from milliseconds to a more readable format
  const seconds = Math.floor((timeRemaining / 1000) % 60);
  const minutes = Math.floor((timeRemaining / 1000 / 60) % 60);
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));

  return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

const handleRequest = frames(async (ctx) => {
  const backUrl = currentURL("/");

  let currentId = ctx.searchParams.current;
  let currentAuction: Auction | null = null;
  let nextAuction: Auction | null = null;
  let imageUrl: string | null = null; // Initialize imageUrl variable
  let highestBid: number | null = null;

  // Fetch the current auction if an ID is present
  if (currentId) {
    currentAuction = await fetchAuctionById(currentId);
    if (currentAuction) {
      imageUrl = await fetchNFTImageUrl(currentAuction.nftcontract, currentAuction.nftid);
      highestBid = await fetchHighestBid(currentAuction.auctionid);
      console.log(`NFT Image URL: ${imageUrl}`); // Log the URL
    }   
  }

  // Determine if the "next" button was clicked
  const isNextClicked = ctx.searchParams.direction === 'next';

  if (isNextClicked && currentAuction) {
    // Fetch the next set of auctions based on the current auction's end time
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select('*')
      .order('endtime', { ascending: true })
      .gt('endtime', currentAuction.endtime)
      .limit(1); // Fetch only the next auction

    if (error) {
      console.error('Error fetching next auction:', error);
    } else if (auctions?.length) {
      nextAuction = auctions[0]; // Set the next auction
      if (nextAuction) { // Ensure nextAuction is not null
          currentId = nextAuction.auctionid; // Update currentId to the next auction's ID
        } // Update currentId to the next auction's ID
    }
  } else if (!currentId) {
    // Initial load: Fetch the first auction
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select('*')
      .order('endtime', { ascending: true })
      .limit(1); // Fetch only the first auction

    if (error) {
      console.error('Error fetching first auction:', error);
    } else if (auctions?.length) {
      currentAuction = auctions[0]; // Set the current auction
      if (currentAuction) { // Ensure currentAuction is not null
        currentId = currentAuction.auctionid; // Update currentId to the current auction's ID
        imageUrl = await fetchNFTImageUrl(currentAuction.nftcontract, currentAuction.nftid); // Fetch NFT image URL
        highestBid = await fetchHighestBid(currentAuction.auctionid);
        console.log(`NFT Image URL: ${imageUrl}`); // Log the URL
      }
    }
  }

  // Logic to render the carousel item and "next" button, using the updated currentId
  const carouselItem = currentAuction ? (
    <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
    <div tw="flex flex-row">
    <div tw="flex flex-col items-center justify-center p-4">
    <img width={200} src={imageUrl || "https://framesjs.org/og.png"} />
      <div tw="flex flex-col items-left">
        <h2 tw="text-3xl sm:text-4xl lg:text-5xl/none">Id: {currentAuction.auctionid}</h2>
        <h2 tw="text-3xl sm:text-4xl lg:text-5xl/none">Min Bid: {currentAuction.minbid} | {highestBid ? `Current highest bid: ${highestBid}` : "Current highest bid: No Bids yet"}  </h2>
        <h2 tw="text-3xl sm:text-4xl lg:text-5xl/none">End Time. {calculateTimeRemaining(currentAuction.endtime)}</h2>
        </div>
       </div>
      </div>
  </div>
  ) : (
    <div tw="flex flex-col items-center justify-center p-4">
      <h1 tw="text-xl font-bold">No More Auctions</h1>
    </div>
  );

  if(ctx.searchParams.action === 'bid'){
    const amount = Number(ctx.message?.inputText);
    if(amount){
      const { data, error } = await supabase
      .from('bids')
      .insert([
        { auctionid: currentId, fid: Number(ctx.message?.requesterFid), bidamount: amount }
      ]);

    if (error) {
      console.error('Error inserting bid:', error);
      return {
        image:(<div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
        <div tw="flex flex-row">
          <div tw="flex flex-col items-center justify-center p-4">
            <h1 tw="text-5xl font-bold tracking-tighter">Unable to place Bid</h1>
           </div>
          </div>
      </div>),
       buttons: [
        <Button
              action="post"
              target={backUrl.origin}
            >
              Home
            </Button>,
        ]
      }
    } else {
      return {
        image: (
          <><div tw="w-full h-full flex flex-row justify-center items-center">
            {carouselItem}
            <h2 tw="text-5xl font-bold tracking-tighter">Bid Successful</h2>
          </div>
          </>
        ),
        buttons: [
          <Button
          action="post"
          target={backUrl.origin}
        >
          Home
        </Button>,
        ],
      };
    } 
    }
    return {
      image: (
        <div tw="w-full h-full flex flex-row justify-center items-center">
          {carouselItem}
        </div>
      ),
      buttons: currentAuction ? [
      <Button
         action="post"
         target={{ query: { current: currentId,direction: "", action: "bid" } }}
       >
        Bid
       </Button>
       
      ] : [],
      textInput: "Enter bid amount",
    };
  }


  return {
    image: (
      <div tw="w-full h-full flex flex-row justify-center items-center">
        {carouselItem}
      </div>
    ),
    buttons: currentAuction ? [
      <Button
        action="post"
        target={{ query: { current: currentId, direction: "next", action: "" } }}
      >
        Next →
      </Button>,
      <Button
       action="post"
       target={{ query: { current: currentId,direction: "", action: "bid" } }}
     >
      Bid
     </Button>
    ] : [],
  };
});

export const GET = handleRequest;
export const POST = handleRequest;