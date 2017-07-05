/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React, {Component} from 'react'
import API from '../../../data/api.js'
import {hasValidScopes} from '../../../utils/action-buttons'

class Documents extends Component {
    constructor(props) {
        super(props);
        this.client = new API();
        this.api_id = this.props.match.params.api_uuid;
        this.state = {
            newDocName: "",
            newDocSourceType: "INLINE",
            newDocURL: "",
            newDocFilePath:null,
            addingNewDoc: false,
            newDocSummary:"",
            newDocFile:null,
            documentsList:null
            //newDocInfo: {name: "", summary: "", sourceType:"INLINE", sourceUrl:"", file:""}
        };
        this.addNewDocBtnListner = this.addNewDocBtnListner.bind(this);
        this.handleNewDocInputChange = this.handleNewDocInputChange.bind(this);
        this.submitAddNewDocListner = this.submitAddNewDocListner.bind(this);
        this.cancelAddNewDocListner = this.cancelAddNewDocListner.bind(this);
    }

    componentDidMount() {
        let docs = this.client.getDocuments(this.api_id);

        docs.then( response => {
            this.setState({documentsList:response.obj.list});
        });
    }

    addNewDocBtnListner() {
        this.state.addingNewDoc ? this.setState({addingNewDoc: false}) : this.setState({addingNewDoc: true})
    }

    submitAddNewDocListner() {
        var api_documents_data = {
            documentId: "",
            name: this.state.newDocName,
            type: "HOWTO",
            summary: this.state.newDocSummary,
            sourceType: this.state.newDocSourceType,
            sourceUrl: this.state.newDocURL,
            inlineContent: "string",
            permission: '[{"groupId" : "1000", "permission" : ["READ","UPDATE"]},{"groupId" : "1001", "permission" : ["READ","UPDATE"]}]',
            visibility: "API_LEVEL"
        }
        var promised_add = this.client.addDocument(this.api_id, api_documents_data);
        promised_add.catch(function (error) {
            var error_data = JSON.parse(error_response.data);
            var message = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
        }).then((done) => {
            var dt_data = done.obj;
            //var sourceType = dt_data.sourceType;
            var docId = dt_data.documentId;

            if (api_documents_data.sourceType == "FILE") {
                var file = this.state.newDocFile;
                var promised_add_file = this.client.addFileToDocument(this.api_id, docId, file);
                promised_add_file.catch(function (error) {
                    console.error("Failed adding file to the newly added document")
                });
            }
            var addedFile = done;
            console.log("LIST is:" + this.state.documentsList);
            var updatedDocList = this.state.documentsList;
            updatedDocList.push(api_documents_data);
            debugger;
            this.setState({
                //newState:"samitha"
                documentsList: updatedDocList,
                addingNewDoc: false
                //documentsList:["a","b","c"]
            });
        });
    }

        //this.setState({addingNewDoc: false})


    handleNewDocInputChange(event) {
        const name = event.target.name;
      /*  if (name == "newDocSourceType"){
            this.setState({
                [name]: event.target.selectedValue
            });
        }*/

        this.setState({
            [name]: event.target.value
        });
        if (event.target.type == "file") {
            this.setState({
                newDocFile: event.target.files[0]
            });
        }

    }

    cancelAddNewDocListner(){
        this.setState( {
            newDocName: "",
            newDocSourceType: "INLINE",
            newDocURL: "",
            newDocFilePath:null,
            addingNewDoc: false,
            newDocSummary:"",
            newDocFile:null,
        });
    }

    render() {
        return (
            <div>
                <button onClick={this.addNewDocBtnListner}>Add New Document</button>
                <div>
                    {this.state.addingNewDoc &&
                        <NewDocDiv
                            newDocName={this.state.newDocName}
                            onNewDocInfoChange={this.handleNewDocInputChange}
                            selectedSourceType={this.state.newDocSourceType}
                            newDocFilePath = {this.state.newDocFilePath}
                            onSubmitAddNewDoc = {this.submitAddNewDocListner}
                            onCancelAddNewDoc={this.cancelAddNewDocListner}
                        />}
                </div>
                <DocumentsTable apiId={this.api_id} client={this.client} documentsList={this.state.documentsList}/>

            </div>
        );
    }
}

class DocumentsTable extends Component {
    constructor(props){
        super(props);
    }

    render() {
        return (
            <div>
                <table className="table table-striped table-hover table-bordered display data-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Source Type</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.props.documentsList && this.props.documentsList.map(
                            doc => {
                                return (
                                    <tr key={doc.id}>
                                        <td>
                                            {doc.name}
                                        </td>
                                        <td>
                                            {doc.sourceType}
                                        </td>
                                        <td>
                                            <ActionsCellDiv/>
                                        </td>
                                    </tr>
                                );
                            })
                    }
                    </tbody>
                </table>
            </div>
        );
    }

}

class NewDocDiv extends Component {
    constructor(props) {
        super(props);
        this.state = {sourceURL: "", summary: "", sourceFile: ""};
    }

    render() {
        return (
            <div>
                <NewDocInfoDiv
                    onNewDocInfoChange={this.props.onNewDocInfoChange}/>
                <NewDocSourceDiv
                    onNewDocInfoChange={this.props.onNewDocInfoChange}
                    selectedSourceType={this.props.selectedSourceType}
                    newDocFilePath = {this.props.newDocFilePath}
                />
                <div name="action-buttons">
                    <button onClick={this.props.onSubmitAddNewDoc}>Add</button>
                    <button onClick={this.props.onCancelAddNewDoc}>Cancel</button>
                </div>
            </div>
        );
    }

}
class NewDocInfoDiv extends Component {
    constructor(props){
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    handleInputChange(e){
        this.props.onNewDocInfoChange(e);
    }
    render() {
        return (
            <div>
                <div>
                    <label>Name*</label>
                    <input type="text" name="newDocName" onChange={this.handleInputChange}/>
                </div>
                <div>
                    <label>Summary</label>
                    <textarea name="newDocSummary" onChange={this.handleInputChange}></textarea>
                </div>
            </div>
        )
    }
}


class NewDocSourceDiv extends Component {
    constructor(props) {
        super(props);
        this.handleInputChange = this.handleInputChange.bind(this);
    }
    handleInputChange(e){
        this.props.onNewDocInfoChange(e);
    }
    render() {
        return (
            <div>
                <lable>Source</lable>
                <ul style={{listStyleType:'none'}}>
                    <li>
                        <label>
                            <input type="radio" name="newDocSourceType" value="INLINE" onClick={this.handleInputChange}/>
                            Inline
                        </label>
                    </li>
                    <li>
                        <label>
                            <input type="radio" name="newDocSourceType" value="URL" onClick={this.handleInputChange}/>
                            URL
                        </label>
                        {this.props.selectedSourceType == "URL" &&
                            <input type="text" name="newDocURL" onChange={this.handleInputChange}/>
                        }
                    </li>
                    <li>
                        <label>
                            <input type="radio" name="newDocSourceType" value="FILE" onClick={this.handleInputChange}/>
                            File
                        </label>
                        {this.props.selectedSourceType == "FILE" &&
                            <div>
                                <form>
                                    <div>
                                        <input type="file" name="newDocFilePath"
                                               onChange={this.handleInputChange}/>
                                    </div>
                                </form>
                            </div>
                        }
                    </li>
                </ul>


            </div>
        );
    }
}

class ActionsCellDiv extends Component {
    render(){
        return (
            <div></div>
        );
    }
}
export default Documents;

/*

 # Component hierarchy

 -Documents  -- state: newDocName
     -DocumentsTable-- state: documentsList
     -NewDocDiv
         -NewDocInfoDiv
         -NewDocSourceDiv


 # states

 New doc items:
 name  - Documents,
 summary - NewDocDiv
 source url - NewDocDiv
 source File - NewDocDiv
 source type -  Documents

 documentsList - DocumentsTable
 */