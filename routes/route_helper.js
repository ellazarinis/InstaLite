const bcrypt = require('bcrypt'); 
// Setup of face API
// var path = require('path');
// const { ChromaClient } = require("chromadb");
// const fs = require('fs');
// const tf = require('@tensorflow/tfjs-node');
//const faceapi = require('@vladmandic/face-api');


var route_helper = function() {
    return {


        // Function for encrypting passwords WITH SALT
        // Look at the bcrypt hashing routines
        encryptPassword: (password, callback) => {
            // TODO: Implement this
            const saltRounds = 10;

            // generate salt
            bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                    callback(err);
                    return;
                } else {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(null, hash);
                        }
                    });
                }
            });

            
        }, // other way to do this? no return statement?

        // Function that validates the user is actually logged in,
        // which should only be possible if they've been authenticated
        // It can look at either an ID (as an int) or a username (as a string)
        isLoggedIn: (req, obj) => {
            if (typeof obj === 'string' || obj instanceof String)
                return req.session.username != null && req.session.username == obj;
            else
                return req.session.user_id != null && req.session.user_id == obj;
        },

        // Checks that every character is a space, letter, number, or one of the following: .,?,_
        isOK: (str) => {
            if (str == null)
                return false;
            for (var i = 0; i < str.length; i++) {
                if (!/[A-Za-z0-9 \.\?,_]/.test(str[i])) {
                    return false;
                }
            }
            return true;
        }        
    };
};

var encryptPassword = function(password, callback) {
    return route_helper().encryptPassword(password, callback);
}

var isOK = function(req) {
    return route_helper().isOK(req);
}

var isLoggedIn = function(req, obj) {
    return route_helper().isLoggedIn(req, obj);
}

function isValidEmail(email) {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
}

function isValidDateMMDDYYYY(dateString) {
    // Check the pattern matches 'MM/DD/YYYY'
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;
    if (!regex.test(dateString)) {
        return false; 
    }

    // Destructure the date string into month, day, and year
    const [month, day, year] = dateString.split('/').map(Number);

    // Create a date object from the year, month, and day
    const date = new Date(year, month - 1, day);

    // Check the date hasn't rolled over to the next month
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
}



module.exports = {
    isOK,
    isLoggedIn,
    encryptPassword,
    isValidEmail,
    isValidDateMMDDYYYY
};