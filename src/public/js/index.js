function ValidateEmail(input) {

    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  
    if (input.value.match(validRegex)) {
      return true;
  
    } else {  
      return false;
  
    }
}

const user_sid = user_steam;

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('form[action="/email"][method="post"]').addEventListener('submit', (e) => {
        e.preventDefault()

        if(!user_sid){
            alert('login')
        }
        
        if(ValidateEmail(e.target.querySelector('input[type="text"]'))){
            alert(e.target.querySelector('input[type="text"]').value)
        } else {
            alert(e.target.querySelector('input[type="text"]').value)
        }
    })
})