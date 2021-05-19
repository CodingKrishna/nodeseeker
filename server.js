import express from 'express'
import fetch from 'node-fetch'
import cache from 'memory-cache'
import dotenv from 'dotenv'
import router from './swagger.js'

const app = express()
const fundCache = new cache.Cache()

app.use('/', router)
dotenv.config()

const AMFI_WEBSITE = 'https://www.amfiindia.com/spages/NAVAll.txt'
const AMFI_FUND_REGEX = '(.*);(.*);(.*);(.*);(.*);(.*)'
const TIMEOUT = parseInt(process.env.TIMEOUT ?? 1800000)
const COUNTRY = process.env.COUNTRY ?? "en-IN"
const TIMEZONE = process.env.TIMEZONE ?? "Asia/Kolkata"


async function fetchWebpage() {
    let webpage_text = ''
    try {
        let webpage = await fetch(AMFI_WEBSITE)
        webpage_text = await webpage.text()
    } catch (e) {
        console.error(e)
    }
    return webpage_text
}

function extractFunds(webpage) {
    let lines = webpage.split(/\r\n|\r|\n/)
    lines = lines.filter(element => element !== ' ')
    let funds = []
    lines.forEach(element => {
        let re = new RegExp(AMFI_FUND_REGEX);
        if (re.test(element)) {
            let attrs = element.match(re)
            funds.push({
                'schemeCode': attrs[1],
                'schemeName': attrs[4],
                'nav': attrs[5],
                'date': attrs[6],
                'updatedAt': new Date(Date.now())
                    .toLocaleString(COUNTRY, { "timeZone": TIMEZONE })
            })
        }
    });
    return funds
}

async function reloadCacheAndFetch(scheme_code) {
    console.log("Reloading cache...");
    fundCache.clear()
    let rawtext = await fetchWebpage()
    let funds = extractFunds(rawtext)
    funds.forEach(fund => {
        fundCache.put(fund.schemeCode, JSON.stringify(fund), TIMEOUT)
    })
    return fundCache.get(scheme_code)
}

app.get('/getNAV/:scheme_code', async (req, res) => {
    const { scheme_code } = req.params
    const { force_update } = req.query

    console.log(`Fetching scheme code:${scheme_code}, force update:${force_update}`);
    let entry = fundCache.get(scheme_code)
    if (entry == null || force_update === 'true') {
        entry = await reloadCacheAndFetch(scheme_code)
    }
    console.log(`Sending response: ${entry}`);
    res.status(200).send(JSON.parse(entry))
})

app.listen(process.env.PORT || 5000, () => { console.log('Nodeseeker GO!') })
