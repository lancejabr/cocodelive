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

const database = firebase.database()

const publicURL = 'https://alpha.cocode.live/'

export function setOnAuth(onAuth) {
    firebase.auth().onAuthStateChanged(user => {
        if(user){
            onAuth()
            user.getIdToken()
        }
    })
}

export class Script {
    constructor(name) {
        this.id = name.toLowerCase()

        this.liveDocRef = database.ref('live_docs/' + this.id)
        this.changesRef = this.liveDocRef.child('changes')
        this.isRunningRef = this.liveDocRef.child('isRunning')
        this.outputRef = this.liveDocRef.child('output')
    }

    static create(name, completion) {
        console.log('Creating script', name)
        const thisRef = database.ref('live_docs/' + name.toLowerCase())
        thisRef.set({
            displayName: name,
            activeUsers: 0,
            isRunning: false,
        }).then(() => {
            thisRef.child('changes').push(
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
        let name = this.id
        console.log('Opening ' + name)

        this.liveDocRef.once('value').then(snapshot => {
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

    run(codeTxt) {
        this.setIsRunning(true)

        let request = new XMLHttpRequest()
        const url = 'https://us-central1-co-code-live.cloudfunctions.net/pyRun'

        let params = JSON.stringify({ code: codeTxt })
        request.open("POST", url, true)
        request.setRequestHeader("Content-Type", "application/json")

        request.onreadystatechange = function(){
            if(request.readyState !== 4) return

            if(request.status === 200) {

                let newOutput = JSON.parse(request.responseText)

                if('error' in newOutput){
                    switch(newOutput.error){
                        case 1: // couldn't run script
                            this.output('The script could not be run.')
                            break
                        case 2: // script timeout
                            this.output('Script exceeded maximum allowed running time.')
                            break
                        default:
                            this.output('Could not run the script.')
                    }
                }

                if('code' in newOutput){
                    this.output('Script completed.')
                    this.output('Return code: ' + newOutput.code)
                }

                if('stdout' in newOutput) {
                    this.output('Program output:')
                    this.output(newOutput.stdout)
                }

                if('stderr' in newOutput) {
                    const evilStrings = [
                        'Could not find platform dependent libraries <exec_prefix>',
                        'Consider setting $PYTHONHOME to <prefix>[:<exec_prefix>]',
                        'Could not find platform independent libraries <prefix>',
                        'ImportError: No module named site',
                    ]
                    let msg = newOutput.stderr
                    for(let s of evilStrings){
                        msg = msg.replace(s, '')
                    }
                    msg = msg.trim()
                    if(msg !== '') {
                        this.output('Program errors:')
                        this.output(msg)
                    }
                }

            } else {
                this.output('Could not run the script')
                console.log(request)
            }

            this.setIsRunning(false)
        }.bind(this)

        request.send(params)
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