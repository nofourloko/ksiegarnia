const express = require('express')
const router = express.Router()
const {books, categories} = require("../examples")
const { con }  = require('../Controller/db_connection')
const session = require('express-session')
const sql = `SELECT * FROM Kategorie`;
const sql2 = `SELECT * FROM Książki`;

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

router.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true
}));

router.use("/", async (req, res, next) => {
    con.query(sql)
        .then( categories => {
            req.categories = categories
            return con.query(sql2)      
        })
        .then(books => {
            console.log(books)
            req.books = books
            next()
        })
        .catch((err) => {
            console.log(err)
            next()
        })
});

router.get('/', (req, res) => {
    res.render('./main/index.ejs', {books : req.books || [], categories: req.categories || []})
})

router.post('/newItem', (req, res) => {
    const {bookAuthor} = req.body
    const upadtedItems = [bookAuthor]
    const previousItems = req.cookies['CartProducts']

    if (previousItems) {
        const parsedItems = JSON.parse(previousItems);
        upadtedItems.push(...parsedItems);
    }

    res.cookie('CartProducts', JSON.stringify(upadtedItems), { maxAge: 3600 * 1000 });
    res.json({ success : true});
})


router.post('/removeItem', (req, res) => {
    const {bookAuthor} = req.body
    const upadtedItems = JSON.parse(req.cookies['CartProducts']).filter(item => item !== bookAuthor)

    
    res.cookie('CartProducts', JSON.stringify(upadtedItems), { maxAge: 3600 * 1000 });
    res.json({ success : true});
})

router.get('/cart', (req, res) => {
    const cartItems =  JSON.parse(req.cookies['CartProducts']) || []
    let price = 0
    cartItems.forEach((element, idx )=> {
        const found_item = req.books.find(item => item.id === parseInt(element))
        cartItems[idx] = found_item
        price += found_item.Cena
    });

    console.log(cartItems)

    res.render('./cart/index.ejs', { cartItems : cartItems, categories: null, purchase_stages, current : [ 'Koszyk' ], price})
})

router.get('/cart/purchase', (req, res) => {
    res.render('./cart/shipping.ejs', { categories: null, purchase_stages, current : [ 'Koszyk' ,'Dostawa i płatność' ] })
})

router.get('/cart/purchase/no-regestration', (req, res) => {
    res.render('./cart/shipping-no-registration.ejs', { categories: null, purchase_stages, current : [ 'Koszyk' ,'Dostawa i płatność' ] })
})

router.get('/cart/purchase/finaliztion', (req, res) => {
    const cartItems =  JSON.parse(req.cookies['CartProducts']) || []
    const form_data = req.session.form_data || {};

    cartItems.forEach((element, idx )=> {
        const found_item = req.books.find(item => item.id === parseInt(element))
        cartItems[idx] = found_item
    });
    res.render('./cart/finalization.ejs', { categories: null, cartItems, purchase_stages, current : [ 'Koszyk' ,'Dostawa i płatność', "Finalizacja" ] , form_data})
})

router.post('/cart/finalization', (req, res) => {
    const form_data = req.body
    req.session.form_data = form_data;
    res.redirect('/cart/purchase/finaliztion')
})
module.exports = router