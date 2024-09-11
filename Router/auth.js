const express = require('express')
const {books, categories} = require("../examples")
const router = express.Router()
const { con }  = require('../Controller/db_connection')

router.get("/auth", (req,res) => {
    res.render('./auth/index.ejs', {categories: categories })
})

router.post('/auth/emailCheck', (req, res) => {
    const {email} = req.body
    const sql = `SELECT * FROM Uzytkownicy WHERE Email = '${email}'`

        con.connection.connect(function(err) {
            if (err) throw err;
            con.connection.query(sql, function (err, result) {
                if (err) {
                    res.status(500).json({error: 'Database error'});
                    return;
                }
    
                if(result.length > 0 ){
                    res.json({no_result : true})
                }else{
                    res.json({no_result: true})
                }
                
              });
          });
    
       
      res.json({no_result: true})
})




module.exports = router