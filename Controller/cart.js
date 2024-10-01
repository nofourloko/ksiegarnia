const CookiesHelper = require("./cookiesHelper");

class Cart {
    constructor(req){
        this.cartItems = []
        if(req.cookies['CartProducts']){
            this.cartItems = JSON.parse(req.cookies['CartProducts'])
        }
    }

    updateCartItemsCookie = (res, new_items) => {
        res.cookie('CartProducts', JSON.stringify(new_items), { maxAge: 3600 * 1000 });
    }

    getCartItems(req){
        let cartItems = []
        if(req.cookies['CartProducts']){
            cartItems = JSON.parse(req.cookies['CartProducts'])
        }

        return cartItems
    }

    updateCartItems(req, bookId, action) {
        const previousItems = CookiesHelper.getCartItems(req);
        let found = false;
    
        previousItems.forEach((item) => {
            if (item.id === bookId) {
                if (action === 'increase') {
                    item.quantity += 1;
                } else if (action === 'updateQuantity') {
                    item.quantity = parseInt(req.body.value);
                }
                found = true;
            }
        });
    
        if (action === 'increase' && !found) {
            previousItems.push({ id: bookId, quantity: 1 });
        }
    
        return previousItems;
    }
}

module.exports = Cart