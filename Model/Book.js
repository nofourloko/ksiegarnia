const Cart = require("./Cart");

class Book extends Cart{
    
    constructor(title, author, price){
        super(title, author, price)
    }

    
}

module.exports = Book