const express = require('express')
const { con } = require('../Controller/db_connection')
const router = express.Router()
const { getCartItems } = require('../Controller/cookiesHelper')
const StaticData = require('../Controller/staticData')
const CookiesHelper = require('../Controller/cookiesHelper')
const View = require('../Controller/View')
const User = require('../Model/User')

router.get('/', (req, res) => {
    const userId = User.isLogged(req)
    let cartItems = CookiesHelper.getCartItems(req)
    console.log(cartItems)
    let price = 0.0

    if(cartItems.length > 0){
        
        cartItems.forEach((element, idx )=> {
            const found_item = req.books.find(item => item.id === parseInt(element.id))
            const price_for_quantities = (parseFloat(found_item.Cena) * parseFloat(element.quantity)).toFixed(2)
            cartItems[idx] = { ...found_item , quantity : element.quantity }
            cartItems[idx].Cena = price_for_quantities
            price = (parseFloat(price) +  parseFloat(price_for_quantities)).toFixed(2)
        });

        View.renderView(req, res, './cart/index.ejs', {
            purchase_stages: StaticData.getPurchaseStages(),
            current : [ 'Koszyk' ],
            suggested : [],
            price,
            cartItems
        })
    }else if(userId){
        const query = `
            SELECT 
                Książki.id, Autor, Tytuł, Cena
            FROM 
                Książki 
            JOIN 
                ulubione 
            ON Książki.id = ulubione.id_książki WHERE ulubione.id_uzytkownika = ?
        `

        con.executeQuery(query, [ userId ], res, (result) => {
            View.renderView(req, res, './cart/index.ejs', {
                purchase_stages: StaticData.getPurchaseStages(),
                current : [ 'Koszyk' ], 
                price, 
                suggested : result,
                cartItems
            })
        })
    }else{
        View.renderView(req, res, './cart/index.ejs', {
            purchase_stages: StaticData.getPurchaseStages(), 
            current : [ 'Koszyk' ], 
            price, 
            suggested : [],
            cartItems
        })
    }
   
})

router.get('/purchase/delivery', (req, res) => {
    const userId = User.isLogged(req)
    if(userId){
        const query = `SELECT * FROM Adresy WHERE id_uzytkownika = ? AND usuniety = 0`
        con.executeQuery(query, [ userId ], res, (result) => {
            View.renderView(req, res, './cart/shipping_logged.ejs', {
                purchase_stages: StaticData.getPurchaseStages(), 
                current : [ 'Koszyk' ,'Dostawa i płatność' ], 
                addreses : result
            })
        })
    }else {
        View.renderView(req, res, `./cart/shipping.ejs`, {
            purchase_stages: StaticData.getPurchaseStages(), 
            current : [ 'Koszyk' ,'Dostawa i płatność' ]
        })
    }
})

router.get('/purchase/no-regestration', (req, res) => {
    View.renderView(req, res, './cart/shipping-no-registration.ejs', {
        data : null,
        provinces: StaticData.getProvinces(),
        original_url: null,
        purchase_stages: StaticData.getPurchaseStages(), 
        current : [ 'Koszyk' ,'Dostawa i płatność' ],
    })
})

router.get('/purchase/finaliztion', (req, res) => {
    const cartItems = getCartItems(req)
    console.log(req.query)
    const { address_id } = req.query
    const sql = "SELECT * FROM Adresy WHERE id = ?"
    console.log(address_id)
    con.executeQuery(sql, [ address_id ], res, (result) => {
        const form_data = result[0]
            delete form_data.id
            delete form_data['domyślny']
            delete form_data.id_uzytkownika
            delete form_data['usuniety']
            let price = 0.0
            form_data['Metoda dostawy'] = req.query['Metoda dostawy']
            form_data['Metoda płatności'] = req.query['Metoda płatności']

            cartItems.forEach((element, idx ) => {
                const found_item = req.books.find(item => item.id === parseInt(element.id))
                const price_for_quantities = (parseFloat(found_item.Cena) * parseFloat(element.quantity)).toFixed(2)
                cartItems[idx] = { ...found_item , quantity : element.quantity }
                cartItems[idx].Cena = price_for_quantities
                price = (parseFloat(price) +  parseFloat(price_for_quantities)).toFixed(2)

            });
        View.renderView(req, res, './cart/finalization.ejs' ,
            { 
                cartItems, 
                purchase_stages: StaticData.getPurchaseStages(), 
                current : [ 'Koszyk' ,'Dostawa i płatność', "Finalizacja" ] , 
                form_data,
                price,
                address_id,
            }
        )
    })
})


router.post('/purchase/complete', (req, res) => {
    const { price, payment, delivery, address_id, cart_products } = req.body
    const userId = User.isLogged(req)
    const today = new Date()
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    const price_to_pay = price > 200 ? (price - (20 / 100) * price).toFixed(2) : price

    const sql = `
        INSERT INTO 
            \`Zamówienia\`(
                \`Data_zakupu\`, \`Id_użytkownika\`, \`Przedmioty\`, \`Zapłacona_kwota\`, 
                \`id_adresu\`,\`oceniona\`,\`Metoda dostawy\`,\`Metoda płatności\`
            ) 
        VALUES ('${formattedDate}',${userId},'${JSON.stringify(cart_products)}',${price_to_pay},${address_id}, ${0}, '${delivery}', '${payment}' )`

    con.executeQuery(sql, [], res, (result) => {
        res.clearCookie('CartProducts')
        res.json({orderId : result.insertId})
    })
})

router.get('/purchase/success/:orderId', (req, res) => {
    const {orderId} = req.params
    View.renderView(req, res, './cart/success.ejs', {orderId, logged : req.user ? true : false})
})



router.post('/finalization', (req, res) => {
    const form_data = req.body
    console.log(form_data)

    if(req.cookies['User']){
        const queryString = new URLSearchParams(form_data).toString();
        res.redirect(`/cart/purchase/finaliztion?${queryString}`)

    }else{
        const sql = `
            INSERT INTO Adresy (Telefon, Ulica, Województwo, \`Kod pocztowy\`, Miasto, \`E-mail\`, id_uzytkownika) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            parseInt(form_data.Telefon),
            form_data.Ulica,
            form_data.Województwo,
            form_data['Kod_pocztowy'],
            form_data.Miasto,
            form_data['Email'],
            form_data.id_uzytkownika
        ];

        con.executeQuery(sql, values, res, (result) => {
            form_data.address_id = result.insertId
            const queryString = new URLSearchParams(form_data).toString();
            res.redirect(`/cart/purchase/finaliztion?${queryString}`)
        })
    }   
   
    
})

module.exports = router 