import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import {
  createPublicClient,
  http,
  parseAbi,
  parseAbiItem,
  stringify,
} from "viem";
import { mainnet } from "viem/chains";

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
interface CoinGeckoResponse {
  tether: {
    usd: number; // The USDT price in USD
  };
}

const app = new Hono();
app.use(prettyJSON());
const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

async function fetchUSDTPrice(): Promise<number> {
  try {
    // Send a GET request to fetch the price of USDT in USD
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd"
    );

    // Validate the response
    if (response.status !== 200) {
      throw new Error(`Failed to fetch USDT price: HTTP ${response.status}`);
    }

    // Get the data from the response and ensure it matches the expected structure
    const data: CoinGeckoResponse = await response.json();

    // Extract the USDT price in USD
    const usdtPrice = data.tether.usd;

    return usdtPrice; // Return the USDT price
  } catch (error) {
    // Handle errors that might occur during the request
    console.error("Error fetching USDT price:", error);
    throw new Error("Failed to fetch USDT price"); // Rethrow the error for further handling
  }
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

//  /getUSDTEvents    listen USDT transfer events
app.get("/getUSDTEvents", async (c) => {
  const blockNumber = await client.getBlockNumber();
  const logs = await client.getLogs({
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ),
    fromBlock: blockNumber - 5n,
    toBlock: blockNumber,
  });

  await client.watchEvent({
    address: USDT_ADDRESS,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ),
    onLogs: (logs) => {
      for (const log of logs) {
        console.log(
          `USDT Tranfer from ${log.args.from} to ${log.args.to} value ${log.args.value}`
        );
      }
    },
  });
  return c.json({ logs: stringify(logs, null, 2) });
});

//  /sendPush     Send push notification when trading USDT value exceeds 1k
app.get("/sendPush", async (c) => {
  const price = await fetchUSDTPrice();

  if (price > 1000) {
    return c.json({ msg: `Push Notification send to user with ${price}` });
  }

  return c.json({ msg: `Trading value is below 1k ${price}` });
});

//  /getUSDTIndex    Index USDT transfer history
app.get("/getUSDTIndex", async (c) => {
  const logs = await client.getLogs({
    address: USDT_ADDRESS,
    event: parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    ),
  });

  return c.json({ data: stringify(logs, null, 2) });
});
//  /sendLink      Send a link token to people whose USDT trade exceeds 500

export default app;
