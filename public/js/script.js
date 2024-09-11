
const popUpShow = (error) => {
    const pop_up = document.getElementById(error ?'pop_up_error' :'pop_up')
    pop_up.style.visibility= 'visible'
    pop_up.classList.remove('slide-out-bottom')
    pop_up.classList.add('slide-in-bottom')
    setTimeout(() => {
        pop_up.classList.remove('slide-in-bottom')
        pop_up.classList.add('slide-out-bottom')
    },2000)
}

async function isEmailValid(event) {
    event.preventDefault();
    const emailInput = document.getElementById('emailInput').value;
    const emailField = document.getElementById('email_field');
    const passwordField = document.getElementById('password_field');

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
            body: JSON.stringify({ email : emailInput}),
        })

        const { no_result } = await response.json()
        console.log(no_result)
        if(!no_result){

            emailField.style.display = 'none';
            passwordField.style.display = 'block'
        }

    }catch(err){
        console.log(err)
    }
}

async function addItemToCard(book){
    try{
        const response = await fetch('http://localhost:5000/newItem', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({ bookAuthor : book}),
        })
        
        const result = await response.json()
        if(result.success){
            popUpShow(false)
        }
        

    }catch(err){
        console.log(err)
        popUpShow(true)
    }
 
}

const removeFromCart = async (title) => {
    try{
        const response = await fetch('http://localhost:5000/removeItem', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
              },
            body: JSON.stringify({ bookAuthor : title}),
        })
    
        const result = await response.json()
        if(result.success){
            window.location.href = '/cart'
        }
        

    }catch(err){
        console.log(err)
    }
}




const dropdown_subcategory = (subcategory) => {
    const element = document.getElementById(`sub_category_${subcategory}`)
    element.style.opacity = 1
}