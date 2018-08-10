import firebase from 'firebase'

const initConfig = {
    apiKey: "AIzaSyBNBy3u5QrXr2YsZInf7OqgvalDK7y-qZk",
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
    console.log('Creating doc', id)
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
        console.log('Document created:', id)
        completion(true)
    }).catch(error => {
        console.log('Could not create:', error)
        completion(false)
    })
}

export function openDoc(id, completion) {
    liveDoc(id).once('value').then(snapshot => {
        if(snapshot.val()) {
            completion(snapshot.val())
        } else {
            console.log('Doc', id, 'does not exist')
            completion(null)
        }
    }).catch(error => {
        console.log('Could not getLines', error)
    })
}

export function runDoc(id, onQueue, onStart, onFail) {
    console.log('Attempting to queue', id)

    execQueue(id).set({
        z: 0,
    }).then(() => {
        console.log('Document queued successfully')
        onQueue()

        execQueue(id).on('value', snapshot => {
            if(snapshot.val() === null){
                // the script has started
                onStart()
                execQueue(id).off('value')
            }
        })

    }).catch(error => {
        console.log('Could not queue document:', error)
        onFail()
    })
}

export function onOutputUpdate(id, onUpdate) {
    output(id).on('value', snapshot => {
        if(!snapshot.val()) return
        onUpdate(snapshot.val())
    })
}
