import React, { Component } from 'react'
import './App.css'
import './database'
// import { UnControlled as CodeMirror } from 'react-codemirror2'
import CodeMirror from 'codemirror'

import {
    createNewDoc,
    getLines
} from "../src/database"

import './codemirrorcustom.css'

const generate = require('project-name-generator')

// require('codemirror/lib/codemirror.css');
require('codemirror/theme/idea.css');
// require('codemirror/theme/neat.css');
require('codemirror/mode/python/python.js');
require('codemirror/mode/javascript/javascript.js')

let appStyle = {
    boxSizing: 'border-box',
    backgroundColor: 'rgb(246, 246, 246)',
    position: 'fixed',
    height: '100vh',
    width: '100vw',
    padding: '10px',
    margin: '0',
}

let containerStyle = {
    position: 'relative',

    height: '100%',

    display: 'flex',
    justifyContent: 'space-around',
}

let codeBoxStyle = {
    boxSizing: 'border-box',
    padding: '10px',

    height: '100%',
    flex: '1 1 0',

    backgroundColor: 'lightgray',

    borderColor: 'black',
    borderWidth: '1px',
    borderStyle: 'solid',

    fontFamily: 'monospace',
    fontSize: 'large',
    textAlign: 'left',
}

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
            getLines(window.location.pathname.substring(1), function(txt) {
                console.log(txt)
                this.codeMirror.setValue(txt)
            }.bind(this))
        }
    }

    hasDoc() {
        return window.location.pathname !== '/'
    }

    render() {

        return (
            <div style={appStyle} className="App">
                <div style={containerStyle}>
                    <textarea
                        style={codeBoxStyle}
                        id={'editor'}
                        value={
                            this.hasDoc() ?
                                '# Loading ' + window.location.pathname.substring(1) + '...'
                                : '# Creating new document...'
                        }
                        onChange={() => {}}
                    />
                    <div style={codeBoxStyle}>
                        Output here
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
