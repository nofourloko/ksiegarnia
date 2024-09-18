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

    query(sql_query){
        return new Promise((resolve, reject) => {
            this.connection.query(sql_query, (err, result) => {
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

}

const con = new DBhandler("localhost", "root", "", "Library")



module.exports = { con }