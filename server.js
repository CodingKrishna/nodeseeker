import express from 'express'
import fetch from 'node-fetch'
import cache from 'memory-cache'
import dotenv from 'dotenv'
import router from './swagger.js'

const app = express()
const fundCache = new cache.Cache()

app.use('/', router)
dotenv.config()

const URL = 'https://www.amfiindia.com/spages/NAVAll.txt'
const FUNDS_KEY = "funds"
const TIMEOUT = parseInt(process.env.TIMEOUT ?? 1800000)
const COUNTRY = process.env.COUNTRY ?? "en-IN"
const TIMEZONE = process.env.TIMEZONE ?? "Asia/Kolkata"


async function fetchRawData() {
    let webpage_text = ''
    try {
        let webpage = await fetch(URL)
        webpage_text = await webpage.text()
    } catch (e) {
        console.error(e)
    }
    return webpage_text
}

function extractFunds(webpage) {
    let lines = webpage.split(/\r\n|\r|\n/)
    lines = lines.filter(element => element !== ' ')
    let funds = {}
    lines.forEach(element => {
        let re = new RegExp('(.*);(.*);(.*);(.*);(.*);(.*)');
        if (re.test(element)) {
            let attrs = element.match(re)
            funds[attrs[1]] = {
                'schemeCode': attrs[1],
                'schemeName': attrs[4],
                'nav': attrs[5],
                'date': attrs[6],
                'updatedAt': new Date(Date.now()).toLocaleString(
                    COUNTRY,
                    {"timeZone": TIMEZONE}
                )
            }
        }
    });
    return funds
}

app.get('/getNAV/:scheme_code', async (req, res) => {
    const { scheme_code } = req.params
    const { force_update } = req.query
    console.log(`Request for NAV, scheme code:${scheme_code}, force update:${force_update}`);

    if (force_update === 'true') {
        fundCache.clear()
    }
    const entry = fundCache.get(FUNDS_KEY)
    if (entry) {
        console.log("Successfully retrieved from cache");
        res.status(200).send(JSON.parse(entry)[scheme_code])
    } else {
        console.log("Fetching from API");
        let navdata = await fetchRawData()
        let funds = extractFunds(navdata)
        fundCache.put(FUNDS_KEY, JSON.stringify(funds), TIMEOUT)
        res.status(200).send(funds[scheme_code])
    }
})

app.listen(process.env.PORT || 5000, () => {
    console.log('Server is up!')
})
