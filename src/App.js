import React, { Component } from 'react'
import './App.css'
import './database'

import CodeMirror from 'codemirror'

import * as db from './database'

import './codemirrorcustom.css'
import './theme.css'

const generate = require('project-name-generator')

// require('codemirror/lib/codemirror.css');
require('codemirror/theme/idea.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/python/python.js');
require('codemirror/mode/javascript/javascript.js')

let evilStrings = [
    'Could not find platform dependent libraries <exec_prefix>',
    'Consider setting $PYTHONHOME to <prefix>[:<exec_prefix>]',
]

let editorOptions = {
    mode: 'python',
    version: 2,
    theme: 'custom',
    lineNumbers: true,
    indentUnit: 4,
}

class App extends Component {

    constructor(props) {
        super(props)

    }

    componentDidMount() {
        // create the code editor and set it up
        this.codeMirror = CodeMirror.fromTextArea(document.getElementById('editor'))
        this.codeMirror.setSize(null, '100%')

        // all options defined above
        for(let key in editorOptions) {
            this.codeMirror.setOption(key, editorOptions[key])
        }

        this.codeMirror.on('change', (editor, data) => {
            console.debug(data)
        })

        // make new doc if needed
        if (window.location.pathname === '/') {

            App.writeToConsole('Creating new document...')

            let newName = generate().raw.map(val => {
                return val.charAt(0).toUpperCase() + val.slice(1);
            }).join('')

            // TODO: check database so we don't overwrite

            db.createNewDoc(newName, success => {
                if(success){
                    window.location = window.location + newName
                }
            })
        } else {
            // load document
            let id = window.location.pathname.substring(1)
            App.writeToConsole('Loading ' + id + '...')
            db.openDoc(id, function(doc) {
                if(doc === null){
                    // TODO: handle error
                    return
                }

                this.doc = doc
                this.codeMirror.setValue(doc.lines.join('\n'))
                App.writeToConsole('Loaded ' + doc.displayName + '.')
            }.bind(this))

            this.oldOutputSkipped = false
            db.onOutputUpdate(id, function(newOutput) {

                // skip output from previous run
                if(!this.oldOutputSkipped) {
                    this.oldOutputSkipped = true
                    return
                }

                if('error' in newOutput){
                    switch(newOutput.error){
                        case 1: // couldn't run script
                            App.writeToConsole('The script could not be run.')
                            break
                        case 2: // script timeout
                            App.writeToConsole('Script exceeded maximum allowed running time.')
                            break
                        default:
                    }
                }

                if('returncode' in newOutput){
                    App.writeToConsole('Script completed.')
                    App.writeToConsole('Return code: ' + newOutput.returncode)
                    App.writeToConsole('Program output:')
                }

                if('stdout' in newOutput) {
                    App.writeToConsole(newOutput.stdout + newOutput.stderr, 2)
                }

            }.bind(this))
        }

    }

    static writeToConsole(inMsg, level=1) {
        App.setConsoleWaiting(false)

        if(inMsg === '') return

        let msg = inMsg
        for(let s of evilStrings){
            msg = msg.replace(s, '')
        }
        msg = msg.replace('<', '&lt;').replace('>', '&gt;').replace(/(\r\n|\n|\r)/gm, '\n').trim()
        let msgLines = msg.split('\n').map(line => {
            return `<div>${line}</div>`
        })

        let newDiv = document.createElement('div')
        newDiv.classList.add('ConsoleOutput', 'Row')
        newDiv.innerHTML = `<div>&gt;&nbsp;</div>`.repeat(level) + `<div>${msgLines.join('')}</div>`

        let consoleBody = document.getElementById('consoleBody')
        consoleBody.appendChild(newDiv)
        consoleBody.scrollTop = consoleBody.scrollHeight

        if(msg.endsWith('...')){
            App.setConsoleWaiting(true)
        }
    }

    static setConsoleWaiting(isWaiting) {
        if(isWaiting) {
            App.consoleWaitInterval = setInterval(() => {
                document.getElementById('consoleBody').lastElementChild.innerHTML += '.'
            }, 500)
        } else {
            clearInterval(App.consoleWaitInterval)
        }
    }

    static clearConsole(){
        document.getElementById('consoleBody').innerHTML = ''
    }

    hasDoc() {
        return this.doc !== undefined
    }

    docName() {
        return this.doc.displayName
    }

    runClick() {
        if(!this.hasDoc()) return

        App.writeToConsole('Queueing script...')
        db.runDoc(
            this.docName(),
            () => { // on queue
                App.writeToConsole('Script queued successfully.')
                App.writeToConsole('Waiting to run...')
            },
            () => { // on run start
                App.writeToConsole('Script running...')
            },
            () => { // on fail
                App.writeToConsole('Script could not be run.')
            })
    }

    render() {

        return (
            <div id={'app'}>
                <div id={'mainContainer'}>
                    <div className={'Column'}>
                        <textarea
                            style={{flex: '1 1 0'}}
                            id={'editor'}
                            value={''}
                            onChange={() => {}}
                        />
                    </div>
                    <div className={'Column'}>
                        <div id={'runToolBar'}>
                            <button className={'Button'} id={'runButton'} onClick={this.runClick.bind(this)}>&#9658;</button>
                        </div>
                        <div id={'console'}>
                            <div id={'consoleHeader'} className={'Row'}>
                                Console
                                <button className={'Button'} id={'clearButton'} onClick={App.clearConsole}>
                                    clear
                                </button>
                            </div>
                            <div id={'consoleBody'}> </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
