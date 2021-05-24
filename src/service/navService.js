import fetch from 'node-fetch'
import cache from 'memory-cache'
import dotenv from 'dotenv'

const fundCache = new cache.Cache()
dotenv.config()
const AMFI_WEBSITE = 'https://www.amfiindia.com/spages/NAVAll.txt'
const AMFI_FUND_REGEX = '(.*);(.*);(.*);(.*);(.*);(.*)'
const TIMEOUT = parseInt(process.env.TIMEOUT ?? 3600000)
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

async function populateCache() {
    console.log("Reloading cache...");
    let rawtext = await fetchWebpage()
    let funds = extractFunds(rawtext)
    funds.forEach(fund => {
        fundCache.put(fund.schemeCode, JSON.stringify(fund), TIMEOUT)
    })
}

async function reloadCacheAndFetch(scheme_code) {
    fundCache.clear()
    await populateCache()
    return fundCache.get(scheme_code)
}

async function fetchFund(scheme_code, force_update) {
    console.log(`Fetching scheme code:${scheme_code}, force update:${force_update}`);
    let entry = fundCache.get(scheme_code)
    if (entry == null || force_update === 'true') {
        entry = await reloadCacheAndFetch(scheme_code)
    }
    console.log(`Sending response: ${entry}`);
    return entry
}

async function fetchFundByName(name) {
    console.log(`Fetching schemes by text:\'${name}\'`);
    if (fundCache.size() === 0) {
        await populateCache()
    }
    const keys = fundCache.keys()
    let results = []
    for (var i = 0; i < keys.length; i++) {
        const fund = JSON.parse(fundCache.get(keys[i]))
        if (fund.schemeName.includes(name)) {
            results.push(fund)
        }
    }
    return results
}

async function fetchAllFunds() {
    console.log(`Fetching all schemes...`);
    if (fundCache.size() === 0) {
        await populateCache()
    }
    const keys = fundCache.keys()
    let funds = []
    for (var i = 0; i < keys.length; i++) {
        funds.push(JSON.parse(fundCache.get(keys[i])))
    }
    return funds
}

export { fetchFund, fetchFundByName, fetchAllFunds }