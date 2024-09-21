const express = require('express')
const { con } = require('../Controller/db_connection')
const { getCartItems } = require('../Controller/cookiesHelper')
const date_settings = require('./products')
const router = express.Router()

router.use("/", (req, res, next) => {
    if(req.cookies['User']){
        req.user = JSON.parse(req.cookies['User']).id
        next()
    }else{
        res.redirect('/auth')
    }
})
router.post('/add_favourite/:id', (req, res) => {
    const { id }  = req.params
    con.query(`
        INSERT INTO \`ulubione\`(\`id_książki\`, \`id_uzytkownika\`) VALUES (${id}, ${req.user});
        `)
        .then(result => {
            res.json({success: true})
        })
        .catch(err => {
            console.log(err)
            res.status(501).json(err)
        })
})
router.get('/favourites', (req, res ) => {
    con.query(`
        SELECT 
            Książki.id as id_ksiazki, Autor, Tytuł, Cena, \`ulubione\`.\`komentarz\`, \`ulubione\`.\`id\`, \`ulubione\`.\`komentarz\`
        FROM 
            Książki 
        JOIN 
            ulubione 
        ON Książki.id = ulubione.id_książki WHERE ulubione.id_uzytkownika = ${req.user}
    `)
    .then(favourites => {
        res.render(
            './favourites/index.ejs', 
            {
                books : req.books || [], 
                categories: req.categories || [], 
                numberOfItemsInCart: getCartItems(req).length,
                favourites
            }
        )
    })
    .catch(err => {
        console.log(err)
        return
    })
})

router.post('/favourites/add_comment', (req, res ) => {
    const { comment_text, id } = req.body
    con.query(`
        UPDATE \`ulubione\` SET \`komentarz\` = '${comment_text}' WHERE id = ${id}
    `)
    .then(favourites => {
        res.redirect('/user/favourites')
    })
    .catch(err => {
        console.log(err)
        return
    })
})

router.post('/favourites/remove/:id', (req, res ) => {
    const {id} = req.params
    con.query(`
        DELETE FROM ulubione WHERE id = ${id}
    `)
    .then(favourites => {
        res.redirect('/user/favourites')
    })
    .catch(err => {
        console.log(err)
        return
    })
    res.redirect('/user/favourites')
})

router.get("/", (req, res) => {
        con.query(`
            SELECT 
                COUNT(id) AS wszystkie_zamówienia, 
                COUNT(CASE WHEN oceniona = 1 
            THEN 
                Zapłacona_kwota ELSE 0 END) AS wszystkie_opinie 
            FROM 
                Zamówienia 
            WHERE 
                Id_użytkownika = ${req.user};
            `
            
            )
            .then(result => {
                const { wszystkie_zamówienia, wszystkie_opinie } = result[0]
                res.render(
                    './userPanel/index.ejs', 
                    {
                        books : req.books || [], 
                        categories: req.categories || [], 
                        numberOfItemsInCart: getCartItems(req).length,
                        orders : wszystkie_zamówienia,
                        review: wszystkie_opinie
                    })
            })
            .catch(err => {
                console.log(err)
            })
   
})

router.get("/account/adress", (req, res) => {
    con.select(`Adresy`, `id_uzytkownika = ${req.user}`)
        .then(result => {
            console.log(result)
            res.render(
                './userPanel/address/index.ejs', 
                {
                    books : req.books || [], 
                    categories: req.categories || [], 
                    numberOfItemsInCart: getCartItems(req).length,
                    addreses : result
                }
            )
        })
        .catch(err => {
            console.log(err)
            return
        })
   
   
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

router.get('/account/view_opinions', (req, res) => {
    con.query(
        `SELECT 
            Opinie.*,Książki.Autor,Książki.Tytuł
        FROM
            \`Opinie\` JOIN \`Książki\`  
        ON 
            id_książki = \`Książki\`.\`id\` 
        WHERE 
            Id_użytkownika = ${req.user}`
        )
    .then( opinions => {
        console.log(opinions)
        const changed_date_opinions = opinions.map(item => {
            const date = new Date(item.data_dodania)
            item.data_dodania = date.toLocaleDateString('pl-PL', date_settings)
            return item
        })
        
        res.render(
            './userPanel/opinions/view/index.ejs',
            {
                books : req.books || [], 
                categories: req.categories || [], 
                numberOfItemsInCart: getCartItems(req).length,
                opinions: changed_date_opinions
            }
        )
    })
    .catch(err => {
        console.log(err)
        return
    })
})

router.get('/account/add_opinions', (req, res) => {
    con.select('Zamówienia', `Id_użytkownika = ${req.user} AND oceniona = 0`)
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
    const { id, review_text, rate } = req.body
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    const sql = `
        INSERT INTO \`Opinie\`(\`id_książki\`, \`Id_użytkownika\`, \`ocena\`, \`treść\`, \`data_dodania\`) 
        VALUES (${id}, ${req.user}, ${rate} , '${review_text}', '${formattedDate}' )
    `
    con.query(sql)
        .then(result => {
            con.update(`Zamówienia`, 'oceniona', 1, `Id_użytkownika = ${req.user}`)
                .then(next_result => {
                    res.json({
                        success : true
                    })
                })
                .catch(err => {
                    console.log(err)
                })
        })
        .catch(err => {
            console.log(err)
        }) 
    
})

router.get('/orders', (req, res) => {
    con.select(`Zamówienia`, `Id_użytkownika = ${req.user}`)
        .then(orders => {
            const orders_with_all_products = orders.map(item => {
                const order_products = []
                const parsedItems = JSON.parse(item.Przedmioty)
                parsedItems.forEach(element => {
                    const { id, Tytuł, Autor,Cena } = req.books.find(item => item.id === element)
                    order_products.push({ id, Tytuł, Autor, Cena })
                });
                item.Data_zakupu = item.Data_zakupu.toLocaleDateString('pl-PL', date_settings)
                item.Przedmioty = order_products
                return item
            })
            console.log(orders_with_all_products)
            res.render(
                './userPanel/orders/index.ejs', 
                {
                    books : req.books || [], 
                    categories: req.categories || [], 
                    numberOfItemsInCart: getCartItems(req).length,
                    all_orders : orders_with_all_products
                }
            )
        })
})

module.exports = router 