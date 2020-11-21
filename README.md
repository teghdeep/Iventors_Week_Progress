# Iventors_Week_Progress

## How To Start
1. clone website to your local system
2. npm install
3. npm start
4. Server would be hosted on https://localhost:5443/

## Packages Used-:
1. CORS
2. Express
3. Passport

## Steps to be performed on Postman/Insomnia

1.	Signup
URL-: https://localhost:5443/users/signup
body-: {"firstname":"Test","lastname":"Case","username":"test","password":"password","phoneno":"9870500000"}

2.	Login
https://localhost:5443/users/login
{"username":"test","password":"password"}

3.	Change Password
https://localhost:5443/users/changepassword
{"userId":"5fb8eaa3545878285cac2274","oldPassword":"password","newPassword":"pass"}

4.	Fetch User Information
https://localhost:5443/users/:userId
