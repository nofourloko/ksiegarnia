
const CookiesHelper = require("./cookiesHelper")

class View {
    static renderView = (req, res, view, data = {}) => {
        res.render(view, {
            books: req.books || [],
            categories: req.categories || [],
            numberOfItemsInCart: CookiesHelper.getCartItems(req).length,
            ...data
        });
    }
    static getOriginalUrl = (req) => {
        return (req.headers.referer || req.headers.referrer).split('5000/').pop() || ""
    }
}

module.exports = View