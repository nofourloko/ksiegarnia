const express = require('express');
const router = express.Router();
const { con } = require('../Controller/db_connection');
const StaticData = require('../Controller/staticData');
const View = require('../Controller/View');
const Cart = require("../Controller/cart");

function formatOpinionsDate(opinions) {
    return opinions.map(item => {
        const date = new Date(item.data_dodania);
        item.data_dodania = date.toLocaleDateString('pl-PL', StaticData.getDateSettings());
        return item;
    });
}

router.get('/', (req, res) => {
    View.renderView(req, res, './main/index.ejs', {req, text: 'Wszystkie dostępne ksiązki'})
});

router.get('/ksiazka/:id', (req, res) => {
    const query1 = 'SELECT * FROM Książki WHERE id = ?'
    const query2 = 'SELECT * FROM Opinie WHERE id_książki = ?'

    con.executeQuery(query1, [req.params.id], res, ( selectedBook ) => {
        con.executeQuery(query2, [req.params.id], res, ( opinions ) => {
            const additionalData = {
                opinions : formatOpinionsDate(opinions),
                selectedBook: selectedBook[0],
                req
            }

            View.renderView(req, res,'./bookPage/index.ejs', additionalData );
        })
    })
});


router.get('/products/:id/:category_title', (req, res) => {
    const {category_title, id} = req.params
    const filteredBooks = req.books.filter(item => item.Id_kategorii === parseInt(req.params.id));
    req.books = filteredBooks

    View.renderView(req, res, './main/index.ejs', { 
        req, 
        text : category_title, 
        breadcrumbs :  [
            {
                href : '/',
                title: 'Ksiązki'
            },
            {
                href : `/products/${id}/${category_title}`,
                title: category_title
            }
        ]
       
    });
    
});


router.post('/newItem', (req, res) => {
    const { book } = req.body;
    const cart = new Cart(req)
    const updatedItems = cart.updateCartItems(req, book, 'increase');

    const info  = {
        success: true, 
        found: cart.getCartItems(req).some(item => item.id === book) 
    }

    cart.updateCartItemsCookie(res, updatedItems);
    res.json(info);
});

router.post('/removeItem', (req, res) => {
    const { id } = req.body;
    const cart = new Cart(req)
    console.log(id)
    const updatedItems = cart.cartItems.filter(item => item.id !== id);
    cart.updateCartItemsCookie(res, updatedItems);
    res.json({ success: true });
});

router.post('/changeItemQuantity', (req, res) => {
    const cart = new Cart(req)
    const updatedItems = cart.updateCartItems(req, req.body.id, 'updateQuantity');
    cart.updateCartItemsCookie(res, updatedItems);
    res.json({ success: true });
});

router.post('/search', (req, res) => {
    const { searched_title } = req.body;
    const filteredBooks = req.books.filter(item => item.Tytuł.toLowerCase().includes(searched_title.toLowerCase()));
    req.books = filteredBooks
    View.renderView(req, res, './main/index.ejs',{req, text : `Wyniki wyszukiwania dla '${searched_title}'`, breadcrumbs : [
        {
            href: '/',
            title: 'Ksiązki'
        },
        {
            href: ``,
            title: ``
        },
    ]});
});

router.get('/ksiazki/:id/:category/:subcategory', (req, res) => {
    const { id, category, subcategory } = req.params
    const filteredBooks = req.books.filter(item => item.Id_podkategorii === parseInt(id));
    console.log(filteredBooks)
    req.books = filteredBooks
    View.renderView(req, res, './main/index.ejs',{req, text : subcategory , breadcrumbs : [
        {
            href: '/',
            title: 'Ksiązki'
        },
        {
            href: `/products/${filteredBooks[0].Id_kategorii}/${category}`,
            title: category
        },
        {
            href: `/products/${id}/${category}/${subcategory}`,
            title: subcategory
        }
    ]} )
})

module.exports = router
