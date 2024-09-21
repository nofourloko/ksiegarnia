const express = require('express')
const router = express.Router()
const { con }  = require('../Controller/db_connection')
const { getCartItems } = require('../Controller/cookiesHelper')

const date_settings = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  };



router.get('/ksiazka/:id', (req, res) => {
    const { id } = req.params

    con.select('Książki', `id = ${id}`)
        .then( selectedBook => {
            con.select('Opinie', `id_książki = ${id}`)
                .then( opinions => {
                    const changed_date_opinions = opinions.map(item => {
                        const date = new Date(item.data_dodania)
                        item.data_dodania = date.toLocaleDateString('pl-PL', date_settings)
                        return item
                    })

                    res.render(
                        './bookPage/index.ejs', 
                        {
                            books : req.books || [], 
                            categories: req.categories || [], 
                            numberOfItemsInCart: getCartItems(req).length,
                            selectedBook : selectedBook[0],
                            opinions : changed_date_opinions
                        }
                    )
                })
                .catch(err => console.log(`Database error:${err}`))
        })
        .catch(err => console.log(`Database error:${err}`))
})

router.get('/', (req, res) => {
    res.render(
        './main/index.ejs', 
        {
            books : req.books || [], 
            categories: req.categories || [],
            numberOfItemsInCart: getCartItems(req).length
        }
    )
})

router.get('/products/:id/:category_title', (req, res) => {
    const { id} = req.params
    const filtred_books = req.books.filter(item => item.Id_kategorii === parseInt(id))
    res.render(
        './main/index.ejs', 
        {   
            books : filtred_books || [], 
            categories: req.categories || [],
            numberOfItemsInCart: getCartItems(req).length
        }
    )
})

router.post('/newItem', (req, res) => {
    const { book } = req.body
    const previousItems = getCartItems(req)
    let found = false

    if (previousItems) {

        previousItems.map((el,idx) => {
            if(el.id === book){
                el.quantity = el.quantity + 1
                found = true
            }
            return el
        })

        if(!found){
            previousItems.push({id : book, quantity: 1});
        }      
    }

    res.cookie('CartProducts', JSON.stringify(previousItems), { maxAge: 3600 * 1000 });
    res.json({ success : true, found});
})


router.post('/removeItem', (req, res) => {
    const { id } = req.body
    console.log(id)
    const upadtedItems = getCartItems(req).filter(item => item.id !== id)  
    res.cookie('CartProducts', JSON.stringify(upadtedItems), { maxAge: 3600 * 1000 });
    res.json({ success : true});
})

router.post('/changeItemQuantity', (req, res) => {
    const { id, value } =  req.body
    const previousItems = getCartItems(req).map(item => {
        if(item.id === id){
            item.quantity = parseInt(value)
        }

        return item
    })
    res.cookie('CartProducts', JSON.stringify(previousItems), { maxAge: 3600 * 1000 });
    res.json({ success : true});
})

router.post('/search', (req, res) => {
    const { searched_title } = req.body
    const filtred_books = req.books.filter(item => item.Tytuł.toLocaleLowerCase().includes(searched_title.toLocaleLowerCase()))
    res.render(
        './main/index.ejs', 
        {   
            books : filtred_books || [], 
            categories: req.categories || [],
            numberOfItemsInCart: getCartItems(req).length
        }
    )
 
})

module.exports = router, date_settings