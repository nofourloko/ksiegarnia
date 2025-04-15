const path = require('path')
const express = require('express');
const { con } = require('../Controller/db_connection')
const fs = require('fs')
const createInvoice = require('../Controller/invoice');
const { ordersAdjust } = require('./user');
const router = express.Router()

router.get('/:id', (req, res) => {
    const { id } = req.params
    const query = "SELECT * FROM Zamówienia WHERE id = ?"
    const query2 = "SELECT * FROM Adresy WHERE id = ?"
    con.executeQuery(query, [ id ], res, (order) => {
        const { id_adresu } = order[0]
        con.executeQuery(query2, [ id_adresu ], res, (address) => {
            const address_info = address[0]

            const filePath = path.join(__dirname, 'invoice.pdf');
            const stream = fs.createWriteStream(filePath);
        
            createInvoice(address_info, ordersAdjust(order, req)[0], stream)

            stream.on('finish', () => {
                res.download(filePath, 'faktura.pdf', (err) => {
                    if (err) console.error(err);
                    fs.unlinkSync(filePath);
                });

                
            });

            
        })
    })
    
})

module.exports = router