import firebase from 'firebase'

const initConfig = {
    apiKey: "AIzaSyBNBy3u5QrXr2YsZInf7OqgvalDK7y-qZk",
    authDomain: "co-code-live.firebaseapp.com",
    databaseURL: "https://co-code-live.firebaseio.com",
    projectId: "co-code-live",
    storageBucket: "co-code-live.appspot.com",
}
firebase.initializeApp(initConfig)
let db = firebase.firestore()

const publicURL = 'https://alpha.cocode.live/'

export function doc(id) {
    return db.collection('live docs').doc(id)
}

export function createNewDoc(id, completion) {
    console.log('Creating doc', id)
    doc(id).set({
        lines: [
            '# Welcome to your new document!',
            '# Anyone can access this document at the following url:',
            '# ' + publicURL + id,
            '',
            "print('Hello, World!')",
        ]
    }).then(() => {
        console.log('Document created:', id)
        completion(true)
    }).catch(error => {
        console.log('Could not create:', error)
        completion(false)
    })
}

export function getLines(id, completion) {
    doc(id).get().then(doc => {
        if(doc.exists) {
            completion(doc.data().lines.join('\n'))
        } else {
            console.log('Doc', id, 'does not exist')
            completion(null)
        }
    }).catch(error => {
        console.log('Could not getLines', error)
    })
}