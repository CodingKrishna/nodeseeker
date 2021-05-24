import express from 'express'
import { fetchFund } from '../service/navService.js'

const navrouter = express.Router();

navrouter.get('/getNAV/:scheme_code', async (req, res) => {
    const { scheme_code } = req.params
    const { force_update } = req.query
    let response = await fetchFund(scheme_code, force_update)
    res.status(200).send(JSON.parse(response))
})

export default navrouter