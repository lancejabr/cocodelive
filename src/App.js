import React, { Component } from 'react'
import './App.css'
import './database'
// import { UnControlled as CodeMirror } from 'react-codemirror2'
import CodeMirror from 'codemirror'

import {
    createNewDoc,
    openDoc
} from "../src/database"

import './codemirrorcustom.css'

const generate = require('project-name-generator')

// require('codemirror/lib/codemirror.css');
require('codemirror/theme/idea.css');
// require('codemirror/theme/neat.css');
require('codemirror/mode/python/python.js');
require('codemirror/mode/javascript/javascript.js')

let editorOptions = {
    mode: 'python',
    version: 2,
    theme: 'idea',
    lineNumbers: true,
    indentUnit: 4,
}

class App extends Component {

    constructor(props) {
        super(props)

        this.state = {
            startValue: '# You will be redirected...',
        }
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
            console.log(data)
        })

        // make new doc if needed
        if (!this.hasDoc()) {

            let newName = generate().raw.map(val => {
                return val.charAt(0).toUpperCase() + val.slice(1);
            }).join('')

            // TODO: check database so we don't overwrite
            console.log('New doc created:', newName)

            createNewDoc(newName, success => {
                if(success){
                    window.location = window.location + newName
                }
            })
        } else {
            // load document
            openDoc(window.location.pathname.substring(1), function(doc) {
                this.codeMirror.setValue(doc.lines.join('\n'))
            }.bind(this))
        }
    }

    hasDoc() {
        return window.location.pathname !== '/'
    }

    render() {

        return (
            <div id={'app'}>
                <div id={'mainContainer'}>
                    <div className={'Column'}>
                        <textarea
                            style={{flex: '1 1 0'}}
                            id={'editor'}
                            value={
                                this.hasDoc() ?
                                    '# Loading ' + window.location.pathname.substring(1) + '...'
                                    : '# Creating new document...'
                            }
                            onChange={() => {}}
                        />
                    </div>
                    <div className={'Column'}>
                        <div id={'runToolBar'}>
                            <button id={'runButton'}>&#9658;</button>
                        </div>
                        <div id={'console'}>
                            Output here
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
