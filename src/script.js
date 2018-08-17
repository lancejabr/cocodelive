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

export class Script {
    constructor(name) {
        this.id = name.toLowerCase()

        this.liveDocRef = script.ref('live_docs/' + this.id)
        this.changesRef = this.liveDocRef.child('changes')
        this.isRunningRef = this.liveDocRef.child('isRunning')
        this.outputRef = this.liveDocRef.child('output')
    }

    static create(name, completion) {
        console.log('Creating script', name)
        liveDoc(name).set({
            displayName: name,
            activeUsers: 0,
            isRunning: false,
        }).then(() => {
            liveDoc(name).child('changes').push(
                {
                    t: '# Welcome to your new script!\n# Anyone can access this document at the following url:\n# ' + publicURL + name + "\n\nprint('Hello, World!')",
                    r: {
                        f: {l: 0, c: 0}
                    }
                }
            ).then(() => {
                completion(true)
            }).catch(error => {
                console.log('Could not create:', error)
                completion(false)
            })
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
            if (snapshot.val()) {
                let data = snapshot.val()
                console.log('Opened ' + name)
                completion(data)
            } else {
                console.log('Doc', name, 'does not exist')
                completion(null)
            }
        }).catch(error => {
            console.log('Could not open doc', error)
        })
    }

    setIsRunning(isRunning) {
        this.isRunningRef.set(isRunning).catch(error => {
            console.log('Could not set is running', error)
        })
    }

    onStatus(statusCallback) {
        this.isRunningRef.on('value', snapshot => {
            statusCallback(snapshot.val())
        })
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

    output(output) {
        this.outputRef.push(output).then(() => {
            console.log('Output pushed', output)
        }).catch(error => {
            console.error('Could not push output', error)
        })
    }

    onOutput(onOutput, lastKey) {
            this.outputRef.orderByKey().startAt(lastKey || '').on('child_added', snapshot => {
                if (snapshot.key === lastKey) return
                onOutput(snapshot.val())
            })
    }
}