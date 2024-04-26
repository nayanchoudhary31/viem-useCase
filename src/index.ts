import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

//  /getUSDTEvents    listen USDT transfer events 


//  /sendPush     Send push notification when trading USDT value exceeds 1k

//  /getUSDTIndex    Index USDT transfer history

//  /sendLink      Send a link token to people whose USDT trade exceeds 500

export default app
