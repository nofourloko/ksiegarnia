const express = require('express')
const {books, categories} = require("../examples")
const router = express.Router()
const User = require('../Model/User')
const { con }  = require('../Controller/db_connection')
const { getCartItems } = require('../Controller/cookiesHelper')

router.use("/", (req, res, next) => {
    if(!req.cookies['User']){
        next()
    }else{
        res.redirect('/user')
    }
})

router.get("/", (req,res) => {
    if(req.cookies['User']){
        res.redirect("/user")
    }else{
        res.render(
            './auth/index.ejs', 
            {
                categories: req.categories || [], 
                numberOfItemsInCart : getCartItems(req).length 
            }
        )
    }

})

router.get('/register', (req, res) => {
    res.render(
        './auth/registration.ejs', 
        {
            categories: req.categories || [], 
            numberOfItemsInCart : getCartItems(req).length 
        }
    )
})

router.post('/emailCheck', (req, res) => {
    const {email, password} = req.body
    con.select('Uzytkownicy', `Email = '${email}' AND Hasło = '${password}'`)
        .then(result => {
            if(result.length > 0 ){
                res.cookie('User', JSON.stringify({id : result[0].id}))
                res.json({no_result : false})
            }else{
                res.json({no_result: true})
            }
        })
        .catch(err => {
            res.status(500).json({error: 'Database error'});
        })
})

router.post('/registerUser', (req, res) => {
    const {email, password, phone} = req.body
    const user = new User(email, password, phone)
    const sql = `
        INSERT INTO Uzytkownicy( Hasło, Email, Telefon) VALUES ('${user.email}','${user.password}','${user.phone}')
        `
    con.query(sql)
        .then(result => {
            if(result){
                res.cookie('User', JSON.stringify({id : result.insertId}))
                res.json({no_result : false})
            }else{
                res.json({no_result: true})
            }
        })
        .catch(err => {
            res.status(500).json({error: 'Database error'});
        })
})





module.exports = router