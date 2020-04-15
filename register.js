// TODO
function validateForm() {
  var x = document.forms["registerForm"]["username"].value;
  if (x == "") {
    alert("Name must be filled out");
    return false;
  }
  var y = document.forms["registerForm"]["password"].value;
  if (y == "") {
    alert("Password must be filled out");
    return false;
  }
} 
