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
    }

    componentDidMount() {
        this.client = new API();
        this.api_id = this.props.apiDetails.id;
        this.selectedSourceType = "INLINE";
        this.displayDocumentsTable();
    }

    componentDidUpdate(prevProps, prevState) {
        this.displayDocumentsTable();
    }

    _renderActionButtons() {
        // if (type === "display") {
        var icon = $("<i>").addClass("fw");
        var icon_circle = $("<i>").addClass("fw fw-circle-outline fw-stack-2x");
        var icon_edit_span = $("<span>").addClass("fw-stack")
            .append(icon.addClass("fw-edit fw-stack-1x"))
            .append(icon_circle);
        var icon_delete_span = $("<span>").addClass("fw-stack")
            .append(icon.clone()
                .removeClass("fw-edit").addClass("fw-delete fw-stack-1x"))
            .append(icon_circle.clone());
        var cssEdit = "cu-reg-btn btn-edit text-warning doc-listing-update btn-sm";
        if (!hasValidScopes("/apis/{apiId}/documents/{documentId}", "put")) {
            cssEdit = "cu-reg-btn btn-edit text-warning doc-listing-update btn-sm not-active";
        }
        var icon_view_span = $("<span>").addClass("fw-stack")
            .append(icon.clone()
                .removeClass("fw-delete").addClass("fw-view fw-stack-1x"))
            .append(icon_circle.clone());
        var edit_button = $('<a>', {
            id: data.id,
            href: data.id
        })
            .text('Edit ')
            .addClass(cssEdit);
        edit_button = edit_button.prepend(icon_edit_span);
        var cssDelete = "cu-reg-btn btn-delete text-danger doc-listing-delete btn-sm";
        if (!hasValidScopes("/apis/{apiId}/documents/{documentId}", "delete")) {
            cssDelete = "cu-reg-btn btn-delete text-danger doc-listing-delete btn-sm not-active";
        }
        var delete_button = $('<a>', {
            id: data.id
        })
            .text('Delete ')
            .addClass(cssDelete);
        // .append(icon.clone().removeClass("fw-edit").addClass("fw-delete"));
        delete_button = delete_button.prepend(icon_delete_span);

        var href = "#"
        var target = ""

        if (data.sourceType == "URL") {
            href = data.sourceUrl;
            target = "_blank";
        } else if (data.sourceType == "INLINE") {
            var api_id = $('input[name="apiId"]').val();
            href = contextPath + "/apis/" + api_id + "/documents/" + data.documentId + "/docInlineEditor";
            target = "_blank";
        }

        var view_button = $('<a>', {
            id: data.id,
            href: href,
            target: target
        })
            .text('View ')
            .addClass("cu-reg-btn btn-view text-danger doc-content-View btn-sm");
        // .append(icon.clone().removeClass("fw-edit").addClass("fw-delete"));
        view_button = view_button.prepend(icon_view_span);

        return $('<div></div>').append(edit_button).append(view_button)
            .append(delete_button).html();

        //   } else {
        //       return data;
        //   }
    }


    setHandlers() {
        var client = new API();
        /* Re-use same api client in all the tab show events */
        var api_id = $('input[name="apiId"]').val(); // Constant(immutable) over
        // all the tabs since
        // parsing as event data to
        // event handlers

        $(document).on('click', ".doc-listing-delete", {
            api_client: client,
            api_id: api_id
        }, this.deleteDocHandler);
        $(document).on('click', ".doc-listing-update", {
            api_client: client,
            api_id: api_id
        }, this.getAPIDocumentByDocId);

     /*   $(document).on('click', "#add-doc-submit", {
            api_client: client,
            api_id: api_id
        }, this.createDocHandler);*/
      //  this.btnAddDocSubmit.onClick = this.createDocHandler;

        $(document).on('click', "#update-doc-submit", {
            api_client: client,
            api_id: api_id
        }, this.updateAPIDocument);
        $(document).on('click', ".doc-content-View", {
            api_client: client,
            api_id: api_id
        }, this.viewDocContentHandler);
        //$(document).on('click', "#add-new-doc", {}, this.viewDocAdder);
    }

    /*
     "Add New Document" button onClick event listener. (View new doc adding-div when the "Add New Document" button clicked)
     */
    viewDocAdder() {
        this.divNewDoc.style.display = 'block';
        this.btnAddDocSubmit.style.display = 'block';
        this.btnUpdateDocSubmit.style.display = 'none';
        this.addNewDocBtn.style.pointerEvents="none";
        this.addNewDocBtn.style.cursor="default";
        this.inputDocName.value = '';
        this.textAreaSummary.value = '';
        this.inputDocUrl.value = '';
        this.inputDocFileText.value = '';
        this.inputOptionsRadios1.checked = true;
    }

    /*
        Display the documents tab content
     */
    displayDocumentsTable() {
        this.client.get(this.api_id).then(
            (response) => {
                var api_data = JSON.parse(response.data);
                //display documents table if available any
                this.client.getDocuments(this.api_id, this.getDocsCallback);
                //disable "Add New Document" button if doesn't have valid scopes
                if (!hasValidScopes("/apis/{apiId}/documents", "post")) {
                    //TODO add a common button inactive style
                    this.addNewDocBtn.style.pointerEvents="none";
                    this.addNewDocBtn.style.cursor="default";                }
                //Disable edit buttons based on logged in user role permissions
                var userPermissions = api_data.userPermissionsForApi;
                if (!userPermissions.includes("UPDATE")) {
                    //TODO add a common button inactive style
                    this.addNewDocBtn.style.pointerEvents="none";
                    this.addNewDocBtn.style.cursor="default";
                }
            }

            //).catch(Details.apiGetErrorHandler);
        ).catch((e) => {
            if (window.console) {
                console.error("Failed getting details of the API:", e.stack);
            }
        });
    }

    /*
    Show the list of documents added into an API in a table
     */
    getDocsCallback =  function(response) {
        var data = response.obj.list;
        this.state = {documents:response.obj.list};
        this.documents = response.obj.list;

        if (this.documents.length > 0) {
            this.documents.map(this.addItemToDocsTable.bind(this));
            this.divDocContent.style.display = 'block';
            this.divNoDocs.style.display = 'none';
            //$('#no-docs-div').hide();
        } else {
           // $('#no-docs-div').show();
           // $('.doc-content').hide();
            this.divDocContent.style.display = 'none';
            this.divNoDocs.style.display = 'block';
        }
    }.bind(this);

    /*
    Add each document details to the documents table
     */
    addItemToDocsTable(docData){
        var row = this.tblDocs.insertRow(-1);

        var docNameCell = row.insertCell(0);
        var docSourceTypeCell = row.insertCell(1);
        var docSummaryCell = row.insertCell(2);
        var docSourceURLCell = row.insertCell(3);
        var docActionsCell = row.insertCell(4);

        docNameCell.innerHTML = docData.name;
        docSourceTypeCell.innerHTML = docData.sourceType;
        docSummaryCell.innerHTML = docData.summary;
        docSourceURLCell.innerHTML = docData.sourceUrl;

        var actionsDiv = '<div>' +
            '    		      <i>Edit</i>' +
            '        	      <i>View</i>' +
            '        	      <i>Delete</i>' +
            '             </div>';
        docActionsCell.insertAdjacentHTML( 'beforeend', actionsDiv );
        //docActionsCell.innerHTML = actionsDiv;

    }

    /**
     * Event handler on click event for api creation submit button "Add"
     *
     * @param event
     */
    createDocHandler = function createDocHandlerFunction() {
        //input validations
        if (this.inputDocName.value == '' || (this.selectedSourceType == 'URL' && this.inputDocUrl.value == '') || (this.selectedSourceType == 'FILE' && this.inputBrowsedFile.files.length == 0)) {
            //TODO Provide appropriate alert/display message to request to fill all the required fields
            alert("Please fill all the required fields");
            return;
        }
        var api_client = this.client;
        var api_documents_data = {
            documentId: "",
            name: this.inputDocName.value,
            type: "HOWTO",
            summary: this.textAreaSummary.value,
            sourceType: this.selectedSourceType,
            sourceUrl: this.inputDocUrl.value,
            inlineContent: "string",
            //otherTypeName: $('#specifyBox').val(),
            permission: '[{"groupId" : "1000", "permission" : ["READ","UPDATE"]},{"groupId" : "1001", "permission" : ["READ","UPDATE"]}]',
            visibility: "API_LEVEL"
        };
        var promised_add = this.client.addDocument(this.api_id, api_documents_data);

        promised_add.catch(function (error) {
            var error_data = JSON.parse(error_response.data);
            var message = "Error[" + error_data.code + "]: " + error_data.description + " | " + error_data.message + ".";
            noty({
                text: message,
                type: 'error',
                dismissQueue: true,
                modal: true,
                closeWith: ['click', 'backdrop'],
                progressBar: true,
                timeout: 5000,
                layout: 'top',
                theme: 'relax',
                maxVisible: 10
            });
            $('[data-toggle="loading"]').loading('hide');
            console.debug(error_response);
        }).then(function (done) {
            var dt_data = done.obj;
            var sourceType = dt_data.sourceType;
            var docId = dt_data.documentId;

            if (sourceType == "FILE") {
                var file = this.inputBrowsedFile.files[0]
                var promised_add_file = api_client.addFileToDocument(this.api_id, docId, file);
                promised_add_file.catch(function (error) {
                }).then(function (done) {
                    var addedFile = done;
                });
            }

            this.setState({documents:this.state.documents.push(api_documents_data)});
            this.divDocContent.style.display = 'block';
            this.divNoDocs.style.display = 'none';
            this.divNewDoc.style.display = 'none';
            this.addNewDocBtn.style.pointerEvents="auto";
            this.addNewDocBtn.style.cursor="pointer";
            $('#no-docs-div').hide();
            $('#newDoc').fadeOut();
        }.bind(this));
    }.bind(this);


    deleteDocHandler(event) {
        var data_table = $('#doc-table').DataTable();
        var current_row = data_table.row($(this).parents('tr'));
        var documentId = current_row.data().documentId;
        var doc_name = current_row.data().name;
        var api_client = event.data.api_client;
        var api_id = event.data.api_id;
        noty({
            text: 'Do you want to delete <span class="text-info">' + doc_name + '</span> ?',
            type: 'alert',
            dismissQueue: true,
            layout: "topCenter",
            modal: true,
            theme: 'relax',
            buttons: [{
                addClass: 'btn btn-danger',
                text: 'Ok',
                onClick: function ($noty) {
                    $noty.close();
                    let promised_delete = api_client.deleteDocument(api_id, documentId);
                    promised_delete.then(
                        function (response) {
                            if (!response) {
                                return;
                            }
                            current_row.remove();
                            data_table.draw();
                        }
                    );
                }
            },
                {
                    addClass: 'btn btn-info',
                    text: 'Cancel',
                    onClick: function ($noty) {
                        $noty.close();
                    }
                }
            ]
        });
    }

    viewDocContentHandler(event) {
        var data_table = $('#doc-table').DataTable();
        var current_row = data_table.row($(this).parents('tr'));

        var documentId = current_row.data().documentId;
        $('#docId').val(documentId);
        var doc_name = current_row.data().name;

        var api_client = event.data.api_client;
        var api_id = event.data.api_id;
        var sourceType = current_row.data().sourceType;

        if (sourceType == 'FILE') {
            let promised_get_content = api_client.getFileForDocument(api_id, documentId);
            promised_get_content.catch(function (error) {
                var error_data = JSON.parse(error.data);
            }).then(function (done) {
                downloadFile(done);
            });
        }
    }

    cancelDocForm() {
        this.divNewDoc.style.display='none';
        this.addNewDocBtn.style.display='block';
        this.addNewDocBtn.style.pointerEvents="auto";
        this.addNewDocBtn.style.cursor="pointer";
        //$('#updateDoc').hide();
    }



    render() {
        return (
            <div id="document-content" className="tab-content col-md-6 col-sm-6">
                <div className="row-fluid">
                    <div className="control-group">
                        <input type="hidden" id="docId" value="test"/>
                        <div id="doc-header">
                            <a id="add-new-doc" ref={(button) => {
                                this.addNewDocBtn = button
                            }} title="Add New Document"
                               onClick={() => {
                                   this.viewDocAdder();
                               }}
                               className="btn btn-primary add-new-doc btn-sm padding-reduce-on-grid-view">
                                <i className=" glyphicon glyphicon-plus-sign" title="Add New
                                   Document"></i>
                                "Add New Document"
                            </a>
                        </div>
                        <br/>
                        <div id="updateDoc" style={{display: 'none'}}>
                            <h4></h4>
                        </div>
                    </div>
                </div>
                <div className="container-fluid" style={{paddingLeft: 0}}>
                    <div id="newDoc" ref={(div) => {
                        this.divNewDoc = div
                    }} style={{display: 'none'}}>
                        <div className="row-fluid">
                            <div className="col-sm-4 name-column" style={{marginBottom: 10}}>
                                <div className="control-group">
                                    <label className="control-label" htmlFor="docName">Name<span
                                        className="requiredAstrix">*</span></label>
                                    <div className="form-group">
                                        <input type="text"
                                               className="form-control required validInput"
                                               id="docName"
                                               ref={(input) => {
                                                   this.inputDocName = input;
                                               }}/>
                                        <input type="hidden" id="rowId"/>
                                    </div>
                                </div>
                                <div className="control-group">
                                    <label className="control-label">Summary</label>
                                    <div className="controls form-group">
                                        <textarea id="summary" ref={(textArea) => {
                                            this.textAreaSummary = textArea
                                        }} className="form-control" rows="3"
                                                  title="summary"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="col-sm-4">
                                <div className="well">
                                    <div className="form-group">
                                        <label className="control-label">Source</label>
                                        <ul className="nav">
                                            {/*list of going-to-add-new document source type=> INLINE/URL/FILE*/}
                                            <li>
                                                <label>
                                                    <input type="radio" name="docSourceTypeRadioGroup"
                                                           id="optionsRadios1" ref={(input) => {
                                                        this.inputOptionsRadios1 = input
                                                    }}
                                                           onClick={() => {
                                                               this.divSourceUrlDoc.style.display = 'none';
                                                               this.divSourceFile.style.display = 'none';
                                                               this.selectedSourceType = "INLINE";
                                                               this.inputDocUrl.value = "";
                                                           }
                                                           }
                                                    />Inline
                                                </label>
                                            </li>
                                            <li>
                                                <label>
                                                    <input type="radio" name="docSourceTypeRadioGroup"
                                                           id="optionsRadios2"
                                                           onClick={() => {
                                                               if (this.divSourceUrlDoc.style.display == 'block') {
                                                                   this.divSourceUrlDoc.style.display = 'none';
                                                               } else {
                                                                   this.divSourceUrlDoc.style.display = 'block';
                                                               }
                                                               this.divSourceFile.style.display = 'none';
                                                               this.selectedSourceType = "URL";
                                                           }}
                                                    />URL*
                                                </label>
                                                <div id="sourceUrlDoc" ref={(div) => {
                                                    this.divSourceUrlDoc = div
                                                }}
                                                     style={{display: 'none'}}>
                                                    <input type="text"
                                                           className="form-control required"
                                                           title="docUrl" id="docUrl"
                                                           ref={(input) => {
                                                               this.inputDocUrl = input
                                                           }}
                                                    />
                                                </div>
                                            </li>
                                            <li>
                                                <label>
                                                    <input type="radio" name="docSourceTypeRadioGroup"
                                                           id="optionsRadios3"
                                                           onClick={ () => {
                                                               if (this.divSourceFile.style.display == 'block') {
                                                                   this.divSourceFile.style.display = 'none';
                                                               } else {
                                                                   this.divSourceFile.style.display = 'block';
                                                               }
                                                               this.divSourceUrlDoc.style.display = 'none';
                                                               this.selectedSourceType = "FILE";
                                                               this.inputDocUrl.value = "";
                                                           }}
                                                    />
                                                    File
                                                    <a className="icon-question-sign help_popup"

                                                       title="fileDoc_help"></a>
                                                    {/* <a className="icon-question-sign help_popup"
                                                     helpData="fileDoc_help"
                                                     title="fileDoc_help"></a>*/}
                                                    <p id="fileDoc_help"
                                                       className="hide">Upload a documentation
                                                                        file</p>
                                                </label>
                                                {/*<div id="fileNameDiv" ref={(div) => {
                                                    this.divFileName = div
                                                }}
                                                     style={{display: 'none'}}></div>
                                                <button type="button" className="btn btn-secondary"
                                                        id="toggleFileDoc" ref={(button) => {
                                                    this.btnToggleFileDoc = button
                                                }} style={{display: 'none'}}
                                                        onClick={
                                                            () => {
                                                                if (this.btnToggleFileDoc.style.display == 'block') {
                                                                    this.btnToggleFileDoc.style.display = 'none';
                                                                } else {
                                                                    this.btnToggleFileDoc.style.display = 'block';
                                                                }
                                                            }
                                                        }
                                                >
                                                    Change File
                                                </button>*/}
                                                <div id="fileDiv" ref={(div) => {
                                                    this.divSourceFile = div
                                                }} style={{display: 'none'}}>
                                                    <form className="form-horizontal">
                                                        <div>
                                                            <input id="doc-file-text"
                                                                   ref={(input) => {
                                                                       this.inputDocFileText = input
                                                                   }}
                                                                   type="text"
                                                                   placeholder="Click on browse to add a file"
                                                                   className="form-control"
                                                                   readOnly=""/>

                                                            <div className="input-group-btn">
                                                                <button className="btn browse"
                                                                        type="button"
                                                                        title="Browse File">
                                                                    <span
                                                                        className="hidden-xs">Browse</span>
                                                                    <input ref={(input) => {
                                                                        this.inputBrowsedFile = input
                                                                    }} type="file" onChange={() => {
                                                                        this.inputDocFileText.value = this.inputBrowsedFile.value.split("\\").pop();
                                                                    }} multiple/>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>

                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm-12">
                                <div className="form-group">
                                    <button type="button" className="btn btn-primary"
                                            id="add-doc-submit" ref={(button) => {
                                        this.btnAddDocSubmit = button
                                    }}
                                            onClick={() => {
                                                this.createDocHandler();
                                            }}>Add
                                    </button>
                                    <button type="button" className="btn btn-primary"
                                            id="update-doc-submit" ref={(button) => {
                                        this.btnUpdateDocSubmit = button
                                    }}>Update
                                    </button>
                                    <button type="button" className="btn btn-secondary"
                                            onClick={() => this.cancelDocForm()} id='
                                                           clear-doc-form'>Cancel
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="doc-content" ref={(div)=>{this.divDocContent = div }}>
                        <table
                            className="table table-striped table-hover table-bordered display data-table"
                            id="doc-table" ref={(table) => this.tblDocs = table}>
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Source Type</th>
                                <th>Summary</th>
                                <th>Source URL</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>

                            </tbody>
                        </table>
                    </div>
                    <div id="no-docs-div" ref= {(div)=> {this.divNoDocs = div }} className="message message-info"
                         style={{display: 'none'}}>
                        <h4><i
                            className="icon fw fw-info"></i>No documentation associated with the API
                        </h4>
                        <p>There is no documentation created for this API. You can add new
                           documentation to this API by clicking the 'Add New Document'
                           button.</p>
                    </div>
                </div>
            </div>
        )
    }


}

export default Documents;