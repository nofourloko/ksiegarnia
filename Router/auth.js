const express = require('express');
const { con } = require('../Controller/db_connection');
const { getCartItems } = require('../Controller/cookiesHelper');
const crypto = require('crypto');
const User = require('../Model/User');
const View = require('../Controller/View');

const router = express.Router();


router.use('/', (req, res, next) => {
  if (!req.cookies['User']) {
    next();
  } else {
    res.redirect('/user');
  }
});

router.get('/', (req, res) => {
  if (req.cookies['User']) {
    res.redirect('/user');
  } else {
    View.renderView(req, res, './auth/index.ejs', {})
  }
});

router.get('/register', (req, res) => {
  View.renderView(req, res, './auth/registration.ejs', {})
});

router.post('/emailCheck', (req, res) => {
  const { email, password } = req.body;
  const hased_password = User.hashPassword(password)
  const sql = `SELECT * FROM Uzytkownicy WHERE Email = ? AND Hasło = ?`
  con.executeQuery(sql, [email, hased_password], res, (result) => {
    if (result.length > 0) {
        res.cookie('User', JSON.stringify({ id: result[0].id }), { expires: new Date(Date.now() + 3600000), httpOnly: true });
        res.json({ no_result: false });
      } else {
        res.json({ no_result: true });
      }
  })
  
});

router.post('/registerUser', (req, res) => {
  const { email, password, phone, login } = req.body;

  const hashedPassword = User.hashPassword(password)
  const values_sql = [ hashedPassword, email, phone, login ]

  const sql_select = "SELECT * FROM Uzytkownicy WHERE Email = ?"
  const sql_insert = `
    INSERT INTO Uzytkownicy (Hasło, Email, Telefon, Login) 
    VALUES (?, ?, ?, ?)
  `;

  con.executeQuery(sql_select, [email], res, (result_user) => {
    if(result_user.length === 0){
        con.executeQuery(sql_insert, values_sql, res, (result) => {
            if(result){
                res.cookie('User', JSON.stringify({ id: result.insertId }, { expires: new Date(Date.now() + 3600000), httpOnly: true }));
                res.json({ no_result: false });
            }
            
        })
    }else{
        res.json({ no_result: true });
    }
  })
  
});

module.exports = router;
