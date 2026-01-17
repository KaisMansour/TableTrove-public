const bcrypt = require('bcryptjs');
const saltRounds = 10;

const plainPassword = 'restaurant03';

const hash = bcrypt.hashSync(plainPassword, saltRounds);
console.log('Nouveau hash:', hash);

//DORA INFORMATIONS

//Mot de passe
//Sakura Sushi --> test123
//Gourmet --> restaurantpassword
//La Trattoria --> restaurant03
