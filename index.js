const express = require('express')
const app = express()
const port = 3000
const axios = require('axios')
    // gitignore on config folder is recommended
    // put your own admin key
const MY_ADMIN_KEY = "N/A"
const $axios = axios.create({
    baseURL: "https://kapi.kakao.com",
    timeout: 3000,
    headers: {
        Authorization: `KakaoAK ${MY_ADMIN_KEY}`,
        "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    }
})

const CID = "TC0ONETIME"
const PARTNER_ORDER_ID = "test_oid"
const PARTNER_USER_ID = "test_uid"
let tid

// cors setting #1

// const cors = require('cors');
// let corsOptions = {
//     origin: 'https://localhost:8080',
//     credentials: true
// }


// cors setting #2 - header setting
app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:8080")
    res.header("Access-Control-Allow-Headers", "X-Requested-With")
    next()
});


// app.get('/', (req, res) => {
//     res.send('Hello World!')
// })

app.post('/kakaopay', async(req, res) => {

    const response = await $axios({
        method: "post", // 요청 방식
        url: "/v1/payment/ready", // 요청 주소
        params: {
            cid: CID,
            partner_order_id: PARTNER_ORDER_ID,
            partner_user_id: PARTNER_USER_ID,
            item_name: "test_item_name",
            quantity: 1,
            total_amount: 22000,
            vat_amount: 0,
            tax_free_amount: 0,
            approval_url: "http://localhost:3000/success" + `?partner_order_id=${PARTNER_ORDER_ID}&partner_user_id=${PARTNER_USER_ID}&cid=${CID}`,
            fail_url: "http://localhost:3000/fail",
            cancel_url: "http://localhost:3000/cancel",
        } // 제공 데이터(body)
    });

    console.log(response)

    /* 
        success 시 pg_token 외에 tid, oid 등 내려오는게 없기 때문에, 
        tid, oid, uid 등을 pk 로 해서 db에 넣어놓은 후에, 
        oid, uid 등을 success url 에 query로 넘겨서 조회 후 
        approve를 진행하여야 한다.

        이건 예시기 때문에 DB를 연결하지는 않고, tid만 저장.
     */
    tid = response.data.tid

    res.send(response.data.next_redirect_pc_url)
})

app.get('/success', async(req, res) => {
    console.log(req)
    param = req.query

    /* 
    curl -v -X POST "https://kapi.kakao.com/v1/payment/approve" \
    -H "Authorization: KakaoAK ${APP_ADMIN_KEY}' \
    --data-urlencode "cid=TC0ONETIME" \
    --data-urlencode "tid=T1234567890123456789" \
    --data-urlencode "partner_order_id=partner_order_id" \
    --data-urlencode "partner_user_id=partner_user_id" \
    --data-urlencode "pg_token=xxxxxxxxxxxxxxxxxxxx"
    */

    console.log('kakaopay :: success')
    console.log('kakaopay :: send approve')

    const response = await $axios({
        method: "post",
        url: "/v1/payment/approve",
        params: {
            cid: param.cid,
            tid: tid,
            partner_order_id: param.partner_order_id,
            partner_user_id: param.partner_user_id,
            pg_token: param.pg_token,
        }
    });

    console.log('kakaopay :: approve done')
    console.log(`kakaopay :: aid : ${response.data.aid}`)

    res.send("CLOSE THE POPUP")
})

app.get('/fail', (req, res) => {
    console.log('kakaopay :: fail')
})

app.get('/cancel', (req, res) => {
    console.log('kakaopay :: cancel')
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})