import React, { Component } from 'react'
import './App.css'
import './script'

import CodeMirror from 'codemirror'

import * as db from './script'
import { Script } from './script'

import './codemirrorcustom.css'
import './theme.css'

const generate = require('project-name-generator')

// require('codemirror/lib/codemirror.css');
require('codemirror/theme/idea.css');
require('codemirror/theme/neat.css');
require('codemirror/mode/python/python.js');
require('codemirror/mode/javascript/javascript.js')

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

        db.setOnAuth(() => {
            // make new script if needed
            if (window.location.pathname === '/') {

                App.writeToConsole('Creating new document...')

                let newName = generate().raw.map(val => {
                    return val.charAt(0).toUpperCase() + val.slice(1);
                }).join('')

                // TODO: check database so we don't overwrite

                Script.create(newName, success => {
                    if(success){
                        window.location = window.location + newName
                    }
                })
            } else {
                // get script name from url
                let id = window.location.pathname.substring(1)
                this.script = new Script(id)
                App.writeToConsole('Loading ' + id + '...')

                // load the script
                this.script.open(function(data){
                    if(data === null){
                        // TODO: handle error
                        return
                    }

                    // update code mirror text
                    // this.lastLine

                    this.script.onChange(function(change){
                        let fr = change.r.f
                        let to = change.r.t || change.r.f
                        this.codeMirror.replaceRange(
                            change.t,
                            {line: fr.l, ch: fr.c},
                            {line: to.l, ch: to.c},
                            '*ignore'
                        )
                    }.bind(this))

                    this.codeMirror.on('beforeChange', (editor, changeObj) => {
                        // ignore the special event sent by us
                        if(changeObj.origin === '*ignore') return

                        // cancel any other changes (they will be performed after db update)
                        changeObj.cancel()

                        // push change to database
                        let change = {
                            t: changeObj.text,
                            r: {
                                f: {l: changeObj.from.line, c: changeObj.from.ch}
                            }

                        }
                        if(changeObj.to !== changeObj.from) {
                            change.r.t = {l: changeObj.to.line, c: changeObj.to.ch}
                        }

                        this.script.pushChange(change)
                    })

                    // done loading
                    App.writeToConsole('Loaded ' + data.displayName + '.')

                }.bind(this))

                // this.oldOutputSkipped = false
                // db.onOutputUpdate(id, function(newOutput) {
                //
                //     // skip output from previous run
                //     if(!this.oldOutputSkipped) {
                //         this.oldOutputSkipped = true
                //         return
                //     }
                //
                //     if('error' in newOutput){
                //         switch(newOutput.error){
                //             case 1: // couldn't run script
                //                 App.writeToConsole('The script could not be run.')
                //                 break
                //             case 2: // script timeout
                //                 App.writeToConsole('Script exceeded maximum allowed running time.')
                //                 break
                //             default:
                //         }
                //     }
                //
                //     if('returncode' in newOutput){
                //         App.writeToConsole('Script completed.')
                //         App.writeToConsole('Return code: ' + newOutput.returncode)
                //         App.writeToConsole('Program output:')
                //     }
                //
                //     if('stdout' in newOutput) {
                //         App.writeToConsole(newOutput.stdout + newOutput.stderr, 2)
                //     }
                //
                // }.bind(this))
            }
        })
    }

    static writeToConsole(inMsg, level=1) {
        App.setConsoleWaiting(false)

        if(inMsg === '') return

        // sanitize
        let msg = inMsg
        msg = msg.replace('<', '&lt;').replace('>', '&gt;').replace(/(\r\n|\n|\r)/gm, '\n').trim()
        if(msg === '') return
        let msgLines = msg.split('\n').map(line => {
            return `<div>${line}</div>`
        })

        App.waitingDiv = document.createElement('div')
        App.waitingDiv.classList.add('ConsoleOutOutput')
        App.waitingDiv.innerHTML = msgLines.join('')

        let newDiv = document.createElement('div')
        newDiv.classList.add('ConsoleOutput', 'Row')
        newDiv.innerHTML = `<div>&gt;&nbsp;</div>`.repeat(level)
        newDiv.appendChild(App.waitingDiv)

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
                App.waitingDiv.lastElementChild.innerHTML += '.'
            }, 500)
        } else {
            App.waitingDiv = null
            clearInterval(App.consoleWaitInterval)
        }
    }

    static clearConsole(){
        App.setConsoleWaiting(false)
        document.getElementById('consoleBody').innerHTML = ''
    }

    hasDoc() {
        return this.script !== undefined
    }

    docName() {
        return this.script.displayName
    }

    runClick() {
        if(!this.hasDoc()) {
            App.writeToConsole('No script to run.')
            return
        }
        App.writeToConsole('Script running...')
        document.getElementById('runButton').disabled = true

        let request = new XMLHttpRequest()
        const url = 'https://us-central1-co-code-live.cloudfunctions.net/pyRun'

        let params = JSON.stringify({ code: this.codeMirror.getValue('\n') })
        request.open("POST", url, true)
        request.setRequestHeader("Content-Type", "application/json")

        request.onreadystatechange = function() {
            if(request.readyState !== 4) return

            if(request.status === 200) {
                // App.writeToConsole(request.responseText)

                let newOutput = JSON.parse(request.responseText)

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

                if('code' in newOutput){
                    App.writeToConsole('Script completed.')
                    App.writeToConsole('Return code: ' + newOutput.code)
                }

                if('stdout' in newOutput) {
                    App.writeToConsole('Program output:')
                    App.writeToConsole(newOutput.stdout, 2)
                }

                if('stderr' in newOutput) {
                    const evilStrings = [
                        'Could not find platform dependent libraries <exec_prefix>',
                        'Consider setting $PYTHONHOME to <prefix>[:<exec_prefix>]',
                    ]
                    let msg = newOutput.stderr
                    for(let s of evilStrings){
                        msg = msg.replace(s, '')
                    }
                    msg = msg.trim()
                    if(msg !== '') {
                        App.writeToConsole('Program errors:')
                        App.writeToConsole(msg, 2)
                    }
                }

            } else {
                App.writeToConsole('Could not run script.')
                console.log(request)
            }
            document.getElementById('runButton').disabled = false
        }
        request.send(params)
    }

    render() {

        return (
            <div id={'app'}>
                <div id={'mainContainer'}>
                    <div className={'Column'} id={'left'}>
                        <textarea
                            style={{flex: '1 1 0'}}
                            id={'editor'}
                            value={''}
                            onChange={() => {}}
                        />
                    </div>
                    <div className={'Column'} id={'right'}>
                        <div id={'runToolBar'}>
                            <button className={'Button'} id={'runButton'} onClick={this.runClick.bind(this)}>&#9658;</button>
                        </div>
                        <div id={'console'}>
                            <div id={'consoleHeader'}>
                                <button className={'Button'} id={'clearButton'} onClick={App.clearConsole}>
                                    clear
                                </button>
                                Console
                            </div>
                            <div id={'consoleBody'}> </div>
                        </div>
                        <div id={'chat'}>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
