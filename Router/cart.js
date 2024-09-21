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
    let cartItems = getCartItems(req)
    let price = 0.0

    if(cartItems.length > 0){
        
        cartItems.forEach((element, idx )=> {
            const found_item = req.books.find(item => item.id === parseInt(element.id))
            const price_for_quantities = (parseFloat(found_item.Cena) * parseFloat(element.quantity)).toFixed(2)
            cartItems[idx] = { ...found_item , quantity : element.quantity }
            cartItems[idx].Cena = price_for_quantities
            price = (parseFloat(price) +  parseFloat(price_for_quantities)).toFixed(2)
        });

        res.render('./cart/index.ejs', 
            { 
                cartItems : cartItems , 
                categories: req.categories, 
                purchase_stages, 
                current : [ 'Koszyk' ], 
                price, 
                numberOfItemsInCart : cartItems.length ,
                suggested : []
            }
        )
    }else{
        
        if(req.cookies['User']){
            const userId = JSON.parse(req.cookies['User']).id
            
            con.query(`
                SELECT 
                    Książki.id, Autor, Tytuł, Cena
                FROM 
                    Książki 
                JOIN 
                    ulubione 
                ON Książki.id = ulubione.id_książki WHERE ulubione.id_uzytkownika = ${userId}
            `)
            .then(result => {
                console.log(result)
                res.render('./cart/index.ejs', 
                    { 
                        cartItems : cartItems , 
                        categories: req.categories, 
                        purchase_stages, 
                        current : [ 'Koszyk' ], 
                        price, 
                        numberOfItemsInCart : cartItems.length,
                        suggested : result
                    }
                )
            })
            .catch(err => {
                console.log('err', err)
            })
        }else{
            res.render('./cart/index.ejs', 
                { 
                    cartItems : cartItems , 
                    categories: req.categories, 
                    purchase_stages, 
                    current : [ 'Koszyk' ], 
                    price, 
                    numberOfItemsInCart : cartItems.length,
                    suggested : []
                }
            )
        }
        
    }
   
})

router.get('/purchase/delivery', (req, res) => {
    if(req.cookies['User']){
        const id_user = JSON.parse(req.cookies['User']).id
        con.select(`Adresy`, `id_uzytkownika = ${id_user}`)
        .then(result => {
            console.log(result)
            res.render(
                './cart/shipping_logged.ejs', 
                {
                    categories:req.categories, 
                    purchase_stages, 
                    current : [ 'Koszyk' ,'Dostawa i płatność' ] , 
                    numberOfItemsInCart : getCartItems(req).length,
                    addreses : result
                }
            )
        })
        .catch(err => {
            console.log(err)
            return
        })
    } else {
      res.render(
        `./cart/shipping.ej`, 
        { 
            categories:req.categories, 
            purchase_stages, 
            current : [ 'Koszyk' ,'Dostawa i płatność' ] , 
            numberOfItemsInCart : getCartItems(req).length
        }
    )  
    }
    
    
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
    const form_data = req.query;
    let price = 0.0

    cartItems.forEach((element, idx )=> {
        const found_item = req.books.find(item => item.id === parseInt(element.id))
        const price_for_quantities = (parseFloat(found_item.Cena) * parseFloat(element.quantity)).toFixed(2)
        cartItems[idx] = { ...found_item , quantity : element.quantity }
        cartItems[idx].Cena = price_for_quantities
        price = (parseFloat(price) +  parseFloat(price_for_quantities)).toFixed(2)
        console.log(price)
    });

    res.render(
        './cart/finalization.ejs', 
        { 
            categories: null, 
            cartItems, 
            purchase_stages, 
            current : [ 'Koszyk' ,'Dostawa i płatność', "Finalizacja" ] , 
            form_data,  
            price,
            numberOfItemsInCart : cartItems.length
        }
    )
})


router.post('/purchase/complete', (req, res) => {
    const products_ids =  JSON.stringify(req.body.items_ids)
    const {price, payment, delivery} = req.body
    const shipping_user_info = req.body.userInfo
    console.log(products_ids)

    const today = new Date();
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    let user_id = null
    if(req.cookies['User']){
        user_id = JSON.parse(req.cookies['User']).id
    }

    const sql = `
        INSERT INTO 
            \`Zamówienia\`(
                \`Data_zakupu\`, \`Id_użytkownika\`, \`Przedmioty\`, \`Zapłacona_kwota\`, 
                \`id_adresu\`,\`oceniona\`,\`Metoda dostawy\`,\`Metoda płatności\`
            ) 
        VALUES ('${formattedDate}',${user_id},'${products_ids}',${price},${null}, ${0}, '${delivery}', '${payment}' )`

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
    const sql = `
        INSERT INTO Adresy (Telefon, Ulica, Województwo, \`Kod pocztowy\`, Miasto, \`E-mail\`, id_uzytkownika) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        form_data.Telefon,
        form_data.Ulica,
        form_data.Województwo,
        form_data['Kod_pocztowy'],
        form_data.Miasto,
        form_data['Email'],
        form_data.id_uzytkownika
    ];

    con.query(sql,values)
        .then(result => {
            const queryString = new URLSearchParams(form_data).toString();
            res.redirect(`/cart/purchase/finaliztion?${queryString}`)
        })
        .catch(err => {
            console.log(err)
            return
        })
    
})

module.exports = router