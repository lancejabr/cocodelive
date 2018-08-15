import firebase from 'firebase'

const initConfig = {
    authDomain: "co-code-live.firebaseapp.com",
    databaseURL: "https://co-code-live.firebaseio.com",
    projectId: "co-code-live",
    storageBucket: "co-code-live.appspot.com",
}
firebase.initializeApp(initConfig)


const firestore = firebase.firestore()
 const settings = {
    timestampsInSnapshots: true,
 };
firestore.settings(settings);

const publicURL = 'https://alpha.cocode.live/'

function liveDoc(id) { return firestore.collection('live docs').doc(id.toLowerCase()) }

exports.createNewDoc = function(id, completion) {
    console.log('Creating script', id)
    liveDoc(id).set({
        displayName: id,
        activeUsers: 0,
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

exports.openDoc = function(id, completion) {
    liveDoc(id).get().then(doc => {
        if(doc.exists) {
            completion(doc.data())
        } else {
            console.log('Doc', id, 'does not exist')
            completion(null)
        }
    }).catch(error => {
        console.log('Could not getLines', error)
    })
}

exports.runDoc = function(id, completion) {
    console.log('Attempting to queue', id)
    firestore.collection('exec_queue').doc(id.toLowerCase()).set({}).then(() => {
        console.log('Document queued successfully')
        completion(true)
    }).catch(error => {
        console.log('Could not queue document:', error)
        completion(false)
    })
}

exports.onOutputUpdate = function(id, onUpdate) {
    liveDoc(id).onSnapshot(doc => {

    })
}