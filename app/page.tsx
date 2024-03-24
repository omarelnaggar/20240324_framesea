import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "./debug";
import { currentURL } from "./utils";

type State = {
  active: string;
  total_button_presses: number;
};

const initialState = { active: "1", total_button_presses: 0 };

const reducer: FrameReducer<State> = (state, action) => {
  return {
    total_button_presses: state.total_button_presses + 1,
    active: action.postBody?.untrustedData.buttonIndex
      ? String(action.postBody?.untrustedData.buttonIndex)
      : "1",
  };
};

// This is a react server component only
export default async function Home({ searchParams }: NextServerPageProps) {
  console.log("ddsds")
  const url = currentURL("/");
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  console.log("info: state is:", state);

  // then, when done, return next frame
  return (
    <div className="p-4">
      <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>{" "}
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        {/* <FrameImage src="https://framesjs.org/og.png" /> */}
        <FrameImage src="https://framesjs.org/og.png" aspectRatio="1.91:1">
          <div tw="w-full h-full bg-blue-900 text-white justify-center items-center flex flex-row">
            <section tw="flex flex-row" className="w-full py-12 md:py-24">
              <div tw="flex flex-row" className="container flex flex-col items-center justify-center px-4 space-y-4 md:px-6">
                <div tw="flex flex-row" className="flex flex-col items-center space-y-2 text-center">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl lg:text-5xl/none">
                  Welcome to Frames Auction
                </h1>
              </div>
            </div>
          </section>
          </div>
        </FrameImage>
        <FrameButton action="post" target="/auction/create">
          Create Auction
        </FrameButton>
        <FrameButton action="post" target="/browse/nft">
          Browse Auctions
        </FrameButton>
      </FrameContainer>
    </div>
  );
}
