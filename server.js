import express from 'express'
import fetch from 'node-fetch'
import cache from 'memory-cache'
import dotenv from 'dotenv'

dotenv.config()
const app = express()
const fundCache = new cache.Cache()
const URL = 'https://www.amfiindia.com/spages/NAVAll.txt'
const FUNDS_KEY = "funds"
const TIMEOUT = parseInt(process.env.TIMEOUT ?? 1800000)

async function getData() {
    let webpage_text = ''
    try {
        let webpage = await fetch(URL)
        webpage_text = await webpage.text()
    } catch (e) {
        console.error(e)
    }
    return webpage_text
}

function tokenize(text) {
    let lines = text.split(/\r\n|\r|\n/)
    lines = lines.filter(element => element !== ' ')
    let funds = {}
    lines.forEach(element => {
        let re = new RegExp('(.*);(.*);(.*);(.*);(.*);(.*)');
        if (re.test(element)) {
            let attrs = element.match(re)
            funds[attrs[1]] = {
                'scheme_code': attrs[1],
                'scheme_name': attrs[4],
                'nav': attrs[5],
                'date': attrs[6]
            }
        }
    });
    return funds
}

app.get('/getNav/:scheme_code', async (req, res) => {
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
        let navdata = await getData()
        let funds = tokenize(navdata)
        fundCache.put(FUNDS_KEY, JSON.stringify(funds), TIMEOUT)
        res.status(200).send(funds[scheme_code])
    }
})

app.listen(process.env.PORT || 5000, () => {
    console.log('Server is up!')
})
