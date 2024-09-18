const express = require('express')
const { con } = require('../Controller/db_connection')
const { getCartItems } = require('../Controller/cookiesHelper')
const router = express.Router()

router.use("/", (req, res, next) => {
    console.log(req.cookies['User'])
    if(req.cookies['User']){
        req.user = JSON.parse(req.cookies['User']).id
        next()
    }else{
        res.redirect('/auth')
    }
})

router.get("/", (req, res) => {
    res.render(
        './userPanel/index.ejs', 
        {
            books : req.books || [], 
            categories: req.categories || [], 
            numberOfItemsInCart: getCartItems(req).length
        })
   
})

router.get("/account/adress", (req, res) => {
    res.render(
        './userPanel/address/index.ejs', 
        {
            books : req.books || [], 
            categories: req.categories || [], 
            numberOfItemsInCart: getCartItems(req).length
        }
    )
   
})
router.post('/account/adress/add', (req ,res) => {
    const { Telefon, Ulica, Województwo, Miasto, Email,Kod_pocztowy } = req.body;

    const sql = `
        INSERT INTO Adresy (id, Telefon, Ulica, Województwo, \`Kod pocztowy\`, Miasto, \`E-mail\`, id_uzytkownika) 
        VALUES (null, '${Telefon}', '${Ulica}', '${Województwo}', '${Kod_pocztowy}', '${Miasto}', '${Email}', '${req.user}')
    `
    con.query(sql)
        .then(res => {
            res.redirect('/user')
        })
        .catch(err => {
            console.log(err)
            res.redirect('/user')
        })
})

router.get('/logout/clear', (req, res) => {
    res.clearCookie('User')
    res.redirect('/auth')
})

router.get('/account/add_opinions', (req, res) => {
    con.select('Zamówienia', `Id_użytkownika = ${req.user}`)
    .then( orders => {
        const order_products = []
        orders.forEach(item => {
            const parsedItems = JSON.parse(item.Przedmioty)
            parsedItems.forEach(element => {
                const { id, Tytuł, Autor } = req.books.find(item => item.id === element)
                order_products.push({ id, Tytuł, Autor })
            });
        
        })
        res.render(
            './userPanel/opinions/add/index.ejs',
            {
                books : req.books || [], 
                categories: req.categories || [], 
                numberOfItemsInCart: getCartItems(req).length,
                orders_to_review : order_products
            }
        )
    })
    .catch(err => {
        console.log(err)
        return
    })
    
})

router.post('/review/add', (req, res) => {
    const { review_text, rules_aceptation } = req.body
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    const sql = `
        INSERT INTO \`Opinie\`(\`id_książki\`, \`Id_użytkownika\`, \`ocena\`, \`treść\`, \`data_dodania\`) 
        VALUES (33, ${req.user}, 4 , '${review_text}', '${formattedDate}' )
    `
    con.query(sql)
        .then(result => {
            console.log(result)
            res.redirect('/user')
        })
        .catch(err => {
            console.log(err)
        }) 
    
})

module.exports = router 