import firebase from 'firebase'

// const firebase = require('/__/firebase/5.3.0/firebase-app.js')

const initConfig = {
    authDomain: "co-code-live.firebaseapp.com",
    databaseURL: "https://co-code-live.firebaseio.com",
    projectId: "co-code-live",
    storageBucket: "co-code-live.appspot.com",
}
firebase.initializeApp(initConfig)

const database = firebase.database()

const publicURL = 'https://alpha.cocode.live/'

function liveDoc(id) { return database.ref('live_docs/' + id.toLowerCase()) }
function execQueue(id) { return database.ref('exec_queue/' + id.toLowerCase()) }
function output(id) { return database.ref('output/' + id.toLowerCase()) }

export function createNewDoc(id, completion) {
    console.debug('Creating doc', id)
    liveDoc(id).set({
        displayName: id,
        activeUsers: 0,
        lines: [
            '# Welcome to your new script!',
            '# Anyone can access this document at the following url:',
            '# ' + publicURL + id,
            '',
            "print('Hello, World!')",
        ]
    }).then(() => {
        console.debug('Document created:', id)
        completion(true)
    }).catch(error => {
        console.debug('Could not create:', error)
        completion(false)
    })
}

export function openDoc(id, completion) {
    // liveDoc(id).onDisconnect().
    liveDoc(id).once('value').then(snapshot => {
        if(snapshot.val()) {
            completion(snapshot.val())
        } else {
            console.debug('Doc', id, 'does not exist')
            completion(null)
        }
    }).catch(error => {
        console.debug('Could not getLines', error)
    })
}

export function runDoc(id, onQueue, onStart, onFail) {
    console.debug('Attempting to queue', id)

    execQueue(id).set({
        z: 0,
    }).then(() => {
        console.debug('Document queued successfully')
        onQueue()

        execQueue(id).on('value', snapshot => {
            if(snapshot.val() === null){
                // the script has started
                console.debug('Document running')
                onStart()
                execQueue(id).off('value')
            }
        })

    }).catch(error => {
        console.debug('Could not queue document:', error)
        onFail()
    })
}

export function onOutputUpdate(id, onUpdate) {
    output(id).on('value', snapshot => {
        if(!snapshot.val()) return
        console.debug('outputUpdate', snapshot.val())
        onUpdate(snapshot.val())
    })
}
