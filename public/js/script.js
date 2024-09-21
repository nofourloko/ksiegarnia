
const popUpShow = (id) => {
    const pop_up = document.getElementById(id)
    pop_up.style.visibility= 'visible'
    pop_up.classList.remove('slide-out-bottom')
    pop_up.classList.add('slide-in-bottom')
    document.body.style.pointerEvents = 'none';

    setTimeout(() => {
        pop_up.classList.remove('slide-in-bottom')
        pop_up.classList.add('slide-out-bottom')
        document.body.style.pointerEvents = 'auto';
    },2000)
}

async function isEmailValid(event) {
    event.preventDefault();
    const formDiv = document.getElementById('form_email')
    const successForm = document.getElementById('success_div')
    const emailInput = document.getElementById('emailInput').value;
    const passwordInput= document.getElementById('passwordInput').value

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput)) {
        alert("Please enter a valid email address.");
        return false;
    }

    try{
        const response = await fetch('http://localhost:5000/auth/emailCheck', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(
                { 
                    email : emailInput,
                    password : passwordInput 
                }
            ),
        })
        const { no_result } = await response.json()

        if(!no_result){
            formDiv.style.display = 'none'
            successForm.style.display = 'block'
            setTimeout(() => {
                window.location.href = '/user'
            },1500)
        }

    }catch(err){
        console.log(err)
    }
}

async function registration(event) {
    event.preventDefault();
    const formDiv = document.getElementById('form_email')
    const successForm = document.getElementById('success_div')
    const emailInput = document.getElementById('emailInput').value;
    const passwordInput= document.getElementById('passwordInput').value
    const phoneInput = document.getElementById('phoneInput').value

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailInput)) {
        alert("Please enter a valid email address.");
        return false;
    }

    try{
        const response = await fetch('http://localhost:5000/auth/registerUser', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(
                { 
                    email : emailInput,
                    password : passwordInput,
                    phone : passwordInput
                }
            ),
        })
        const { no_result } = await response.json()

        if(!no_result){
            formDiv.style.display = 'none'
            successForm.style.display = 'block'
            setTimeout(() => {
                window.location.reload()
            },1500)
        }

    }catch(err){
        console.log(err)
    }
}

async function addItemToCard(id){
    try{
        const response = await fetch('http://localhost:5000/newItem', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({ book : id}),
        })
        
        const result = await response.json()
        if(result.success){
            if(!result.found){
                const cartBadge = document.getElementById('cartBadge')
                cartBadge.textContent = parseInt(cartBadge.textContent) + 1
            }

            if(window.location.href.split("/")[3] === "cart"){
                window.location.reload()
            }else{
                popUpShow('pop_up')
            }
            
        }
        

    }catch(err){
        console.log(err)
        popUpShow('pop_up_error')
    }
 
}



const removeFromCart = async (id) => {
    try{
        const response = await fetch('http://localhost:5000/removeItem', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({id : id}),
        })
    
        const result = await response.json()
        if(result.success){
            window.location.href = '/cart'
        }
        

    }catch(err){
        console.log(err)
    }
}


async function selectCategory(title, id) {
    console.log(category)
    window.location.href = `/${title}/${id}`
}

const dropdown_subcategory = (subcategory) => {
    const element = document.getElementById(`sub_category_${subcategory}`)
    element.style.display = 'flex'
}

const selectedBook = (id) => {
    window.location.href = `/ksiazka/${id}`
}

async function orderCompletion(form_data, cartItems, price) {
    const userInfo = JSON.parse(form_data)
    const items_ids = JSON.parse(cartItems).map(item => {
        return item.id
    })
    try {
        const response = await fetch('http://localhost:5000/cart/purchase/complete', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(
                {
                    delivery: userInfo['Metoda dostawy'],
                    payment: userInfo['Metoda płatności'],
                    items_ids,
                    price : parseFloat(price).toFixed(2)
                }
            ),
        })
        const {orderId} = await response.json()
        window.location.href = `/cart/purchase/success/${orderId}`
    } catch (error) {
        console.log(error)
        return
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const bookmarks = document.querySelectorAll('.bookmarks_selected_book');
    const contentSections = {
        bookmark_opis: document.getElementById('content_opis'),
        bookmark_opinie: document.getElementById('content_opinie'),
        bookmark_dostepnosc: document.getElementById('content_dostepnosc'),
        bookmark_szczegoly: document.getElementById('content_szczegoly')
    };

    function showSection(sectionId) {
        Object.values(contentSections).forEach(section => {
            section.style.display = 'none'; 
        });
        contentSections[sectionId].style.display = 'block'; 
    }


    bookmarks.forEach(bookmark => {
        bookmark.addEventListener('click', function () {
            const sectionId = this.id;
            showSection(sectionId);
        });
    });

    showSection('bookmark_opis');
});


const selectRate = (rate) => {
    const all_rates = document.querySelectorAll('.rate_options')
    all_rates.forEach((option, index) =>{
        
        if(index < rate){
             option.style.color = '#e8b923'
             option.setAttribute('id', 'star_clicked')
        }else{
            option.style.color = 'black'
        }
    })
    localStorage.setItem('rate', rate)
}

const addComment = async (e, id) => {
    e.preventDefault()
    const rate = localStorage.getItem('rate')
    if(!rate){
        return false
    }
    console.log(rate)
    try {
        const response = await fetch('http://localhost:5000/user/review/add', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify(
                {
                   id, 
                   review_text : e.target[0].value,
                   rate: rate
                }
            ),
        })
        const { success } = await response.json()
        if(success){
            window.location.reload() 
        }

    } catch (error) {
        console.log(error)
        return
    }
}

const showComment = (id) => {
    const element = document.getElementById(id)
    if(element.style.display === 'none'){
        element.style.display = 'block'
    }else{
        element.style.display = 'none'
    }

}

const add_favourite = async (book_id) => {
    try {
        const response = await fetch(`http://localhost:5000/user/add_favourite/${book_id}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
        })

        const { success } = await response.json()

        if(success){
            popUpShow('pop_up_bookmarks')
        }

    } catch (error) {
        console.log(error)
        return
    }
}

const changeQuantity = async (book_id, value, spn) => {
    const span = document.getElementById(spn)
    const new_quantity = parseInt(span.textContent) + value
    const url = new_quantity === 0 ? 'removeItem' : 'changeItemQuantity'

    try {
        const response = await fetch(`http://localhost:5000/${url}`, {
                method: 'POST',
                body : JSON.stringify({id : book_id, value : new_quantity}),
                headers: {
                    "Content-Type": "application/json",
                  },
            })
    
        const { success } = await response.json()
        
        if(success){
            window.location.reload()
            
        }
    
    } catch (error) {
        console.log(error)
        return
    }
    
}