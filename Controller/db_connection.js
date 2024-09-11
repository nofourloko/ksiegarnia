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
                    throw reject(err)
                }
                resolve(result)
            })
        })

    }
}

const con = new DBhandler("localhost", "root", "", "Library")



module.exports = { con }