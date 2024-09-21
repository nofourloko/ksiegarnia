const mysql = require('mysql')


class DBhandler {
    constructor( host, user, password, database ){
        this.connection = mysql.createConnection({
            host,
            user,
            password,
            database 
          });
    }

    query(sql_query, values = []){
        return new Promise((resolve, reject) => {
            this.connection.query(sql_query, values, (err, result) => {
                if(err){
                    console.log(err)
                    throw reject(err)
                }
                resolve(result)
            })
        })

    }
    select(tableName, condition = null){
        const sql = `SELECT * FROM ${tableName} WHERE ${condition? condition : 1}`
        return new Promise((resolve, reject) => {
            this.connection.query(sql, (err, result) => {
                if(err){
                    console.log(err)
                    throw reject(err)
                }
                resolve(result)
            })
        })
    }

    update(tableName, field_to_update, value,  condition ){
        const sql = `UPDATE ${tableName} SET ${field_to_update} = ${value} WHERE ${condition};`
        console.log(sql)
        return new Promise((resolve, reject) => {
            this.connection.query(sql, (err, result) => {
                if(err){
                    console.log(err)
                    throw reject(err)
                }
                resolve(result)
            })
        })
    }
}

const con = new DBhandler("localhost", "root", "", "Library")



module.exports = { con }