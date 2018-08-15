// let generate = require('project-name-generator')
const functions = require('firebase-functions')
// const admin = require('firebase-admin')
// admin.initializeApp()


// exports.bigben = functions.https.onRequest((req, res) => {
//     const hours = (new Date().getHours() % 12) + 1 // London is UTC + 1hr;
//     // console.log('req', req)
//     res.status(200).send(`<!doctype html>
//     <head>
//       <title>Time</title>
//     </head>
//     <body>
//       ${'BONG '.repeat(hours)}
//     </body>
//   </html>`);
// });

// exports.createNewScript = functions.https.onRequest((req, res) => {
//     let newName = generate().raw.map(val => {
//                 return val.charAt(0).toUpperCase() + val.slice(1);
//
//     }).join('')
//
//     console.log('New script created:', newName)
//
//
//
//
//     res.redirect('/' + newName)
// })

// exports.loadDoc = functions.https.onRequest((req, res) => {
//      // res.redirect('/' + newName)
// })