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
    constructor(id){
        this.id = id.toLowerCase()

        this.lines = null
        this.displayName = null
        this.activeUsers = null

        this.liveDocRef = script.ref('live_docs/' + this.id)
        this.changesRef = this.liveDocRef.child('changes')
        this.linesRef = this.liveDocRef.child('lines')
        this.lineRef = (l) => {
            return this.liveDocRef.child('lines/' + l)
        }
    }

    static create(id, completion) {
        console.log('Creating script', id)
        output(id).set({ // create dummy output for client completeness
            'stdout': ''
        })
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

    onLineUpdate(onAdd, onChange, onRemove) {
        this.linesRef.on('child_added', snapshot => {
            onAdd(snapshot.key, snapshot.val())
        })

        this.linesRef.on('child_changed', snapshot => {
            onChange(snapshot.key, snapshot.val())
        })

        this.linesRef.on('child_removed', snapshot => {
            onRemove(snapshot.key)
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

    run(onQueue, onStart, onFail) {
        let id = this.id

        console.log('Attempting to queue', id)

        execQueue(id).set(0).then(() => {
            console.log(id + ' queued successfully')
            onQueue()

            execQueue(id).on('value', snapshot => {
                if(snapshot.val() === null){
                    // the script has started
                    console.log('Document running')
                    onStart()
                    execQueue(id).off('value')
                }
            })

        }).catch(error => {
            console.log('Could not queue document:', error)
            onFail()
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

    updateLine(l, newText) {
        if(newText === this.lines[l]) return

        // this.recentChanges.
        this.lineRef(l).set(newText)
        this.lines[l] = newText
    }

    setLineCount(nLines) {
        if(nLines >= this.lines.length) return

        for(let l = this.lines.length; l > nLines; l--){
            this.lineRef(l-1).remove()
            this.lines.pop()
        }
    }
}

export function onOutputUpdate(id, onUpdate) {
    output(id).on('value', snapshot => {
        if(!snapshot.val()) return
        console.log('outputUpdate', snapshot.val())
        onUpdate(snapshot.val())
    })
}