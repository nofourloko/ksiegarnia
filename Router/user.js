const express = require('express')
const { con } = require('../Controller/db_connection')
const { getCartItems } = require('../Controller/cookiesHelper')
const StaticData = require('../Controller/staticData')
const CookiesHelper = require("../Controller/cookiesHelper")
const View = require('../Controller/View')
const User = require('../Model/User')
const router = express.Router()
const date_settings = StaticData.getDateSettings()
const provinces = StaticData.getProvinces()


const ordersAdjust = (orders, req) => {
    return orders.map(item => {
        const parsedItems = JSON.parse(item.Przedmioty).map(element => {
            const { id, Tytuł, Autor, Cena} = req.books.find(item => item.id === element.id)
            const price_for_quantities = (parseFloat(Cena) * parseFloat(element.quantity)).toFixed(2)
            return { id, Tytuł, Autor, Cena : price_for_quantities , quantity : element.quantity }
        });

        item.Data_zakupu = item.Data_zakupu.toLocaleDateString('pl-PL', StaticData.getDateSettings())
        item.Przedmioty = parsedItems
        
        return item
    })
}



router.use("/", CookiesHelper.ensureUser);
router.post('/add_favourite/:id', (req, res) => {
    const { id }  = req.params
    const query = `INSERT INTO \`ulubione\`(\`id_książki\`, \`id_uzytkownika\`) VALUES (?, ?)`
    con.executeQuery(query, [id, req.user], res, (result) => {
        res.json({success: true})
    })
})

router.get('/favourites', (req, res ) => {
    const query = `
        SELECT 
            Książki.id as id_ksiazki, Autor, Tytuł, Cena, \`ulubione\`.\`komentarz\`, \`ulubione\`.\`id\`, \`ulubione\`.\`komentarz\`
        FROM 
            Książki 
        JOIN 
            ulubione 
        ON Książki.id = ulubione.id_książki WHERE ulubione.id_uzytkownika = ?
    `
    con.executeQuery(query, [req.user], res, (favourites) => {
        View.renderView(req, res,'./favourites/index.ejs',  { favourites, breadcrumbs : [
            {
                href: '/',
                title: "Strona głowna"
            },
            {
                href: '/user/favourites',
                title: "Ulubione"
            }
        ]})
    })
})

router.post('/favourites/add_comment', (req, res ) => {
    const query = `UPDATE \`ulubione\` SET \`komentarz\` = ? WHERE id = ?`
    const params = [req.body.comment_text, req.body.id]

    con.executeQuery(query, params, res, (result) => {
        res.redirect('/user/favourites')
    })
})

router.post('/favourites/remove/:id', (req, res ) => {
    const query = 'DELETE FROM ulubione WHERE id = ?'

    con.executeQuery(query, [ req.params.id ], res, (result) => {
        res.redirect('/user/favourites')
    })
})

router.get("/", (req, res) => {
    const query = `
            SELECT 
                COUNT(id) AS wszystkie_zamówienia, 
                COUNT(CASE WHEN oceniona = 1 
            THEN 
                Zapłacona_kwota ELSE 0 END) AS wszystkie_opinie 
            FROM 
                Zamówienia 
            WHERE 
                Id_użytkownika = ?;
            `
    con.executeQuery(query, [ User.isLogged(req) ], res, (result) => {
        const additionalData = {
            orders : result[0].wszystkie_zamówienia,
            review: result[0].wszystkie_opinie,
            breadcrumbs : [
                {
                    href: '/',
                    title: "Strona głowna"
                },
                {
                    href: '/user',
                    title: "Panel uzuytkownika"
                }
            ]
        }

        View.renderView(req, res, './userPanel/index.ejs', additionalData)
    })  
})

router.get("/account/adress", (req, res) => {
    const query = `SELECT * FROM \`Adresy\` WHERE id_uzytkownika = ? AND usuniety = 0 ORDER BY domyślny DESC`
    con.executeQuery(query, [req.user], res, (result) => {
        const additionalData = {
            addreses : result,
            provinces,
            amount: result.length,
            breadcrumbs : [
                {
                    href: '/',
                    title: "Strona głowna"
                },
                {
                    href: '/user',
                    title: "Panel uzuytkownika"
                },
                {
                    href: '/user/account/adress',
                    title: "Moje adresy"
                }
            ]
        }

        View.renderView(req, res, './userPanel/address/index.ejs', additionalData)
    })
})

router.get("/account/adress/:id", (req,res) => {
    const query = `UPDATE \`Adresy\` SET \`usuniety\` = 1 WHERE id = ?`
    con.executeQuery(query, [ req.params.id ], res, ( result ) => {
        res.redirect(`/${View.getOriginalUrl(req)}`)
    })
})

router.get('/address_form', (req, res) => {
    const additionalData = {
        original_url : View.getOriginalUrl(req),
        data : null,
        provinces: StaticData.getProvinces()
    }
    View.renderView(req, res, './userPanel/address/address_form.ejs', additionalData )
})
router.get('/address_form/:id', (req, res) => {
    const query = `SELECT * FROM Adresy WHERE id = ?`
    con.executeQuery(query, [req.params.id], res, (result) => {
        const additionalData = {
            original_url : View.getOriginalUrl(req),
            data : result[0],
            provinces: StaticData.getProvinces(),
            id: req.params.id
        }
        View.renderView(req, res, './userPanel/address/address_form.ejs', additionalData)
    })
})
router.post('/account/adress/add', (req ,res) => {
    const is_default = req.body.domyślny === 'on' ? 1 : 0
    const url = req.body.url
    const params = [
        req.body.Telefon, 
        req.body.Ulica, 
        req.body.Województwo, 
        req.body.Kod_pocztowy,
        req.body.Miasto, 
        req.body.Email,  
        req.user,
        is_default, 
    ] 

    let sql1 = `
        INSERT INTO Adresy (id, Telefon, Ulica, Województwo, \`Kod pocztowy\`, Miasto, \`E-mail\`, id_uzytkownika, \`domyślny\`, \`usuniety\`) 
        VALUES (null, ?, ?, ?, ?, ?, ?, ?,?, 0)
    `
    let sql2 = null

    if(is_default === 1){
        const tmp = sql1
        sql1 = `UPDATE \`Adresy\` SET \`domyślny\` = 0 WHERE id_uzytkownika = ${req.user}`
        sql2 = tmp
    }

    con.executeQuery(sql1, params, res, (result) => {
        if(sql2){
            con.executeQuery(sql2, params, res, (result) => {
                res.redirect(`/${url}`)
            })
        }else{
            res.redirect(`/${url}`)
        }
    })
    
})
router.post('/account/address/change', (req, res) => {
    const formData = req.body;
    const query = `
        UPDATE Adresy 
        SET 
            Telefon = ?, 
            Ulica = ?, 
            Województwo = ?, 
            \`Kod pocztowy\`= ?, 
            Miasto = ?, 
            \`E-mail\` = ?, 
            id_uzytkownika = ?, 
            domyślny = ?
        WHERE id = ?`;

    const is_default =  formData.domyślny === 'on' ? 1 : 0
    const params = [
        formData.Telefon,
        formData.Ulica,
        formData.Województwo,
        formData.Kod_pocztowy,
        formData.Miasto,
        formData.Email,
        req.user,
        is_default,
        parseInt(formData.id)
    ]
    
    con.executeQuery(query, params, res, (result) => {
        res.redirect(`/${formData.url}`)
    })
})

router.get('/logout/clear', (req, res) => {
    res.clearCookie('User')
    res.redirect('/auth')
})

router.get('/account/view_opinions', (req, res) => {
    const query = `SELECT 
            Opinie.*,Książki.Autor,Książki.Tytuł
        FROM
            \`Opinie\` JOIN \`Książki\`  
        ON 
            id_książki = \`Książki\`.\`id\` 
        WHERE 
            Id_użytkownika = ?
    `

    con.executeQuery(query, [req.user], res, (result) => {
        const changed_date_opinions = opinions.map(item => {
            const date = new Date(item.data_dodania)
            item.data_dodania = date.toLocaleDateString('pl-PL', StaticData.getDateSettings())
            return item
        })
        View.renderView(req, res, './userPanel/opinions/view/index.ejs', { opinions: changed_date_opinions })
    })
})


router.get('/account/add_opinions', (req, res) => {
    const query = `SELECT * FROM Zamówienia WHERE Id_użytkownika = ? AND oceniona = 0`
    con.executeQuery(query, [req.user], res, (orders) => {
        const order_products = []
        orders.forEach(item => {
            JSON.parse(item.Przedmioty).forEach(element => {
                const { id, Tytuł, Autor } = req.books.find(item => item.id === element.id)
                order_products.push({ id, Tytuł, Autor })
            });
        })
        View.renderView(req, res, './userPanel/opinions/add/index.ejs', { orders_to_review : order_products })

    })
})

router.post('/review/add', (req, res) => {
    const { id, review_text, rate } = req.body
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    const sql_data_insert = [id, ,req.user, rate, review_text, formattedDate]

    const sql_insert_opinions = `
        INSERT INTO \`Opinie\`(\`id_książki\`, \`Id_użytkownika\`, \`ocena\`, \`treść\`, \`data_dodania\`) 
        VALUES (?, ?, ? , '?', '?' )
    `
    const sql_update_orders = `UPDATE Zamówienia WHERE \`oceniona\` = 1, AND Id_użytkownika = ?`
    con.executeQuery(sql_insert_opinions, sql_data_insert , res, (result) => {
        con.executeQuery(sql_update_orders, [req.user], res, (next_result) => {
            res.json({
                success : true
            })
        })
    })
})

router.get('/orders', (req, res) => {
    const query = `SELECT * FROM Zamówienia WHERE Id_użytkownika = ?`
    con.executeQuery(query, [ User.isLogged(req) ], res, ( orders ) => {
        View.renderView(req, res, './userPanel/orders/index.ejs', { all_orders : ordersAdjust(orders, req),
            breadcrumbs : [
                {
                    href: '/',
                    title: "Strona głowna"
                },
                {
                    href: '/user',
                    title: "Panel uzuytkownika"
                },
                {
                    href: '/user/orders',
                    title: "Moje zakupy"
                }
            ]
        })
    })
})

router.get('/orders/:id', (req, res) => {
    const { id } = req.params
    const query = "SELECT * FROM Zamówienia WHERE id = ?"
    const query2 = "SELECT * FROM Adresy WHERE id = ?"
    con.executeQuery(query, [ id ], res, (order) => {
        const { id_adresu } = order[0]
        con.executeQuery(query2, [ id_adresu ], res, (address) => {
            const address_info = address[0]
            delete address_info['domyślny']
            delete address_info['id']
            delete address_info['id_uzytkownika']

            View.renderView(req, res, './userPanel/orders/order_details.ejs', {
                order : ordersAdjust(order, req)[0],
                address: address_info
            })
        })
    })
})

router.get('/myinfo', (req, res) => {
    const sql = 'SELECT * FROM Uzytkownicy WHERE id = ?'
    con.executeQuery(sql, [req.user], res, (result) => {
        View.renderView(req, res, './userPanel/my_data/index.ejs', {
            userInfo: result[0],
            breadcrumbs : [
                {
                    href: '/',
                    title: "Strona głowna"
                },
                {
                    href: '/user',
                    title: "Uzytkownik"
                },
                {
                    href: '/user/myinfo',
                    title: "Moje dane"
                }
            ]
        })
    })
})

router.post('/update-profile', (req, res) => {
    const formData = req.body

    const sql = `
        UPDATE \`Uzytkownicy\`
        SET \`Email\` = ?,
            \`Telefon\` = ?,
            \`login\` = ?,
            \`Imie\` = ?,
            \`Nazwisko\` = ?
        WHERE id = ${req.user}
        `

    const data = [
        formData.Email,
        formData.Telefon,
        formData.Login,
        formData.Imie,
        formData.Nazwisko,
    ]

    con.executeQuery(sql, data, res, (result) => {
        res.redirect('/user/myinfo')
    })
})

router.post('/password_change', (req, res) => {
    const { newPassword,currentPassword } = req.body
    console.log(newPassword)
    const new_hased_password = User.hashPassword(newPassword)
    const check_sql = `SELECT * FROM \`Uzytkownicy\`WHERE id = ?`
    const sql = `UPDATE \`Uzytkownicy\` SET Hasło = ? WHERE id = ?
    `
    con.executeQuery(check_sql, [req.user], res, (result) => {
        if(result[0].Hasło === User.hashPassword(currentPassword)){
            con.executeQuery(sql, [new_hased_password, req.user], res, (result) => {
                res.json({success : true})
            })
        }else{
            res.json({success : false})
        }
    })

})

module.exports = router