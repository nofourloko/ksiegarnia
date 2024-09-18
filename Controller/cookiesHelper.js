const getCartItems = (req) => {
    let cartItems = []
    if(req.cookies['CartProducts']){
        cartItems = JSON.parse(req.cookies['CartProducts'])
    }

    return cartItems
}


module.exports = { getCartItems }