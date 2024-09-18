const express = require('express')
const { con } = require('../Controller/db_connection')
const router = express.Router()
const { getCartItems } = require('../Controller/cookiesHelper')

const purchase_stages = [
    {
        title : 'Koszyk'
    },
    {
        title : 'Dostawa i płatność'
    },
    {
        title : 'Finalizacja'
    }
]

router.get('/', (req, res) => {
    let cartItems = []
    let price = 0
    
    if(req.cookies['CartProducts']){
        cartItems = getCartItems(req)
        cartItems.forEach((element, idx )=> {
            console.log(element)
            const found_item = req.books.find(item => item.id === parseInt(element))
            cartItems[idx] = found_item
            price += found_item.Cena
        });
        price = Math.round(price)
    }
    console.log(cartItems)

    res.render('./cart/index.ejs', 
        { 
            cartItems : cartItems , 
            categories: req.categories, 
            purchase_stages, 
            current : [ 'Koszyk' ], 
            price, 
            numberOfItemsInCart : cartItems.length 
        }
    )
})

router.get('/purchase/delivery', (req, res) => {
    res.render(
        './cart/shipping.ejs', 
        { 
            categories:req.categories, 
            purchase_stages, 
            current : [ 'Koszyk' ,'Dostawa i płatność' ] , 
            numberOfItemsInCart : getCartItems(req).length
        }
    )
})

router.get('/purchase/no-regestration', (req, res) => {
    res.render(
        './cart/shipping-no-registration.ejs', 
        { 
            categories: null, 
            purchase_stages, 
            current : [ 'Koszyk' ,'Dostawa i płatność' ],
            numberOfItemsInCart : getCartItems(req).length
        }
    )
})

router.get('/purchase/finaliztion', (req, res) => {
    const cartItems = getCartItems(req)
    const form_data = req.session.form_data || {};

    cartItems.forEach((element, idx )=> {
        const found_item = req.books.find(item => item.id === parseInt(element))
        cartItems[idx] = found_item
    });

    res.render(
        './cart/finalization.ejs', 
        { 
            categories: null, 
            cartItems, 
            purchase_stages, 
            current : [ 'Koszyk' ,'Dostawa i płatność', "Finalizacja" ] , 
            form_data,  
            numberOfItemsInCart : cartItems.length
        }
    )
})


router.post('/purchase/complete', (req, res) => {
    const products_ids =  JSON.stringify(req.body.items_ids)
    const shipping_user_info = req.body.userInfo

    const today = new Date();
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    let user_id = null
    if(req.cookies['User']){
        user_id = JSON.parse(req.cookies['User']).id
    }

    const sql = `
        INSERT INTO \`Zamówienia\`(\`Data_zakupu\`, \`Id_użytkownika\`, \`Przedmioty\`, \`Zapłacona_kwota\`, \`id_adresu\`) 
        VALUES ('${formattedDate}',${user_id},'${products_ids}',${30},${null})`

    con.query(sql)
        .then(result =>{
            res.clearCookie('CartProducts')
            res.json({orderId : result.insertId})
        })
        .catch(err => {
            console.log(err)
        })
})

router.get('/purchase/success/:orderId', (req, res) => {
    const {orderId} = req.params
    res.render('./cart/success.ejs', { categories: req.categories || null, numberOfItemsInCart : getCartItems(req).length, orderId})
})



router.post('/finalization', (req, res) => {
    const form_data = req.body
    req.session.form_data = form_data;
    res.redirect('/cart/purchase/finaliztion')
})

module.exports = router