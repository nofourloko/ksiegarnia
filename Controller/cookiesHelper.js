class CookiesHelper{
    static getCartItems = (req) => {
        let cartItems = []
        if(req.cookies['CartProducts']){
            cartItems = JSON.parse(req.cookies['CartProducts'])
        }

        return cartItems
    }

    static ensureUser = (req, res, next) => {
        if (req.cookies['User']) {
            req.user = JSON.parse(req.cookies['User']).id;
            next();
        } else {
            res.redirect('/auth');
        }
    }

}

module.exports = CookiesHelper 