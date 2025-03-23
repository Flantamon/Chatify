const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const isValidPassword = (password) => password.length >= 8;

module.exports = { isValidEmail, isValidPassword };
