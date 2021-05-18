import express from 'express'
import fetch from 'node-fetch'
import redis from 'redis'
import fs from 'fs'
const app = express()
URL = 'https://www.amfiindia.com/spages/NAVAll.txt'

const redisPort = 6379
const client = redis.createClient(process.env.REDIS_URL || redisPort);

async function getData() {
    let response = ''
    try {
        let res = await fetch(URL)
        response = await res.text()
    } catch (e) {
        console.log(e)
    }
    return response
}

function tokenize(text) {
    let lines = text.split(/\r\n|\r|\n/)
    lines = lines.filter(element => element !==' ')
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



app.get('/getNav/:scheme_code', (req, res) => {
    const { scheme_code } = req.params
    const { force_update } = req.query

    if (force_update === 'true') {
        console.log(force_update);
        client.del("funds")
    }
    try {
        client.get("funds", async (err, data) => {
            if (err) {
                console.error(err)
                throw err
            }

            if (data) {
                console.log("Successfully retrieved from Redis");
                res.status(200).send(JSON.parse(data)[scheme_code])
            } else {
                console.log("Fetching from API");
                let navdata = await getData()
                let funds = tokenize(navdata)
                client.setex("funds", 1800, JSON.stringify(funds))
                res.status(200).send(funds[scheme_code])
            }

        })
    } catch (err) {
        res.status(500).send({ error: err.message });
    }
})

app.listen(process.env.PORT || 5000, () => {
    console.log('server started.')
})
