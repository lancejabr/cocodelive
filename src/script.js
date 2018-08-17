import firebase from 'firebase'

// const firebase = require('/__/firebase/5.3.0/firebase-app.js')

const initConfig = {
    apiKey: "AIzaSyDbtgkKRLRCVGyTgjJl-iOoKSkzVpLVwtU",
    authDomain: "co-code-live.firebaseapp.com",
    databaseURL: "https://co-code-live.firebaseio.com",
    projectId: "co-code-live",
    storageBucket: "co-code-live.appspot.com",
}
firebase.initializeApp(initConfig)

console.log('Authenticating...')
firebase.auth().signInAnonymously().then(cred => {
    console.log('Authenticated:', cred)
}).catch(error => {
    console.error(error, 'Could not authenticate with Firebase')
}).finally(() => {
    console.log('Done authenticating')
})

const script = firebase.database()

const publicURL = 'https://alpha.cocode.live/'

export function setOnAuth(onAuth) {
    firebase.auth().onAuthStateChanged(user => {
        if(user){
            onAuth()
        }
    })
}

function liveDoc(id) { return script.ref('live_docs/' + id.toLowerCase()) }
function execQueue(id) { return script.ref('exec_queue/' + id.toLowerCase()) }
function output(id) { return script.ref('output/' + id.toLowerCase()) }

export class Script {
    constructor(name){
        this.id = name.toLowerCase()

        this.liveDocRef = script.ref('live_docs/' + this.id)
        this.changesRef = this.liveDocRef.child('changes')
    }

    static create(name, completion) {
        console.log('Creating script', name)
        output(name).set({ // create dummy output for client completeness
            'stdout': ''
        })
        liveDoc(name).set({
            displayName: name,
            activeUsers: 0,
            lines: [
                '# Welcome to your new script!',
                '# Anyone can access this document at the following url:',
                '# ' + publicURL + name,
                '',
                "print('Hello, World!')",
            ]
        }).then(() => {
            console.log('Document created:', name)
            completion(true)
        }).catch(error => {
            console.log('Could not create:', error)
            completion(false)
        })
    }

    open(completion) {
        // liveDoc(id).onDisconnect().
        let name = this.id
        let id = this.id
        console.log('Opening ' + name)

        liveDoc(id).once('value').then(snapshot => {
            if(snapshot.val()) {
                let data = snapshot.val()
                this.lines = data.lines
                this.displayName = data.displayName
                this.activeUsers = data.activeUsers

                console.log('Opened ' + name)
                completion(this)
            } else {
                console.log('Doc', name, 'does not exist')
                completion(null)
            }
        }).catch(error => {
            console.log('Could not open doc', error)
        })
    }

    setIsRunning(isRunning) {

    }

    pushChange(change) {
        this.changesRef.push(change).then(() => {
            console.log('Change pushed')
        }).catch(error => {
            console.error('Could not push change', error)
        })
    }

    onChange(onChange) {
        this.changesRef.on('child_added', snapshot => {
            onChange(snapshot.val())
        })
    }
}

export function onOutputUpdate(id, onUpdate) {
    output(id).on('value', snapshot => {
        if(!snapshot.val()) return
        console.log('outputUpdate', snapshot.val())
        onUpdate(snapshot.val())
    })
}